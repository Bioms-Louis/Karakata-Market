const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect } = require('../../middleware/auth');
const { restrictTo } = require('../../middleware/roleCheck');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');
const { query } = require('../../config/database');
router.use(protect);
router.use(restrictTo('admin'));

router.get('/dashboard', adminController.getDashboard);

router.get('/vendors', adminController.getAllVendors);
router.patch('/vendors/:id/status', adminController.updateVendorStatus);

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

router.get('/categories', catchAsync(async (req, res) => {
  const result = await query(
    `SELECT
       c.id,
       c.name,
       c.slug,
       c.description,
       c.icon,
       c.parent_id,
       parent.name AS parent_name,
       (SELECT COUNT(*) FROM products p
        WHERE p.category_id = c.id) AS product_count
     FROM categories c
     LEFT JOIN categories parent ON c.parent_id = parent.id
     ORDER BY c.parent_id NULLS FIRST, c.name`
  );
  sendSuccess(res, 200, 'Categories fetched.', {
    categories: result.rows
  });
}));

router.post('/categories', catchAsync(async (req, res, next) => {
  const { name, description, parentId, icon } = req.body;
  if (!name) return next(new AppError('Category name is required.', 400));

  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').trim();

  const result = await query(
    `INSERT INTO categories (name, slug, description, parent_id, icon)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, slug, description || null, parentId || null, icon || null]
  );

  sendSuccess(res, 201, 'Category created.', { category: result.rows[0] });
}));

router.patch('/categories/:id', catchAsync(async (req, res, next) => {
  const { name, description, icon } = req.body;
  if (!name) return next(new AppError('Name is required.', 400));

  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').trim();

  const result = await query(
    `UPDATE categories
     SET name = $1, slug = $2, description = $3, icon = $4
     WHERE id = $5 RETURNING *`,
    [name, slug, description || null, icon || null, req.params.id]
  );

  if (result.rows.length === 0)
    return next(new AppError('Category not found.', 404));

  sendSuccess(res, 200, 'Category updated.', { category: result.rows[0] });
}));

router.delete('/categories/:id', catchAsync(async (req, res, next) => {
  const productCheck = await query(
    `SELECT COUNT(*) FROM products WHERE category_id = $1`,
    [req.params.id]
  );

  if (parseInt(productCheck.rows[0].count) > 0) {
    return next(new AppError(
      'Cannot delete category with active products. Reassign products first.', 400
    ));
  }

  await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  sendSuccess(res, 200, 'Category deleted.');
}));

router.get('/products', catchAsync(async (req, res) => {
  const { search = '', page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`p.name ILIKE $${params.length}`);
  }

  const where = conditions.length
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const productsResult = await query(
    `SELECT
       p.id, p.name, p.base_price, p.discount_price,
       p.stock_quantity, p.is_active, p.is_featured,
       p.created_at,
       c.name AS category_name,
       v.store_name AS vendor_name,
       (SELECT image_url FROM product_images
        WHERE product_id = p.id AND is_primary = true
        LIMIT 1) AS primary_image
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN vendors v ON p.vendor_id = v.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM products p ${where}`,
    params
  );

  sendSuccess(res, 200, 'Products fetched.', {
    products: productsResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(
        parseInt(countResult.rows[0].count) / limit
      )
    }
  });
}));

router.post('/products', catchAsync(async (req, res, next) => {
  const {
    vendorId, name, description, shortDescription,
    categoryId, basePrice, discountPrice,
    stockQuantity, sku, isFeatured, images, variants
  } = req.body;

  if (!vendorId || !name || !categoryId || !basePrice || !stockQuantity) {
    return next(new AppError(
      'vendorId, name, categoryId, basePrice and stockQuantity are required.', 400
    ));
  }

  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-').trim() + '-' + Date.now();

  const productResult = await query(
    `INSERT INTO products
       (vendor_id, category_id, name, slug, description,
        short_description, base_price, discount_price,
        stock_quantity, sku, is_featured, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
     RETURNING *`,
    [
      vendorId, categoryId, name, slug,
      description || '', shortDescription || '',
      basePrice, discountPrice || null,
      stockQuantity, sku || null, isFeatured || false
    ]
  );

  const product = productResult.rows[0];

  if (images?.length > 0) {
    for (const img of images) {
      await query(
        `INSERT INTO product_images (product_id, image_url, is_primary)
         VALUES ($1, $2, $3)`,
        [product.id, img.url, img.isPrimary || false]
      );
    }
  }

  if (variants?.length > 0) {
    for (const v of variants) {
      if (!v.name) continue;
      let attrs = v.attributes || {};
      if (typeof attrs === 'string') {
        try { attrs = JSON.parse(attrs); } catch { attrs = {}; }
      }
      await query(
        `INSERT INTO product_variants
           (product_id, variant_name, price, stock_quantity, sku, attributes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          product.id, v.name, v.price || null,
          v.stockQuantity || 0, v.sku || null,
          JSON.stringify(attrs)
        ]
      );
    }
  }

  sendSuccess(res, 201, 'Product created.', { product });
}));

router.patch('/products/:id', catchAsync(async (req, res, next) => {
  const { isActive, isFeatured } = req.body;
  const updates = [];
  const params = [];

  if (isActive !== undefined) {
    params.push(isActive);
    updates.push(`is_active = $${params.length}`);
  }
  if (isFeatured !== undefined) {
    params.push(isFeatured);
    updates.push(`is_featured = $${params.length}`);
  }

  if (updates.length === 0) {
    return next(new AppError('No valid fields to update.', 400));
  }

  params.push(req.params.id);
  await query(
    `UPDATE products SET ${updates.join(', ')}
     WHERE id = $${params.length}`,
    params
  );

  sendSuccess(res, 200, 'Product updated.');
}));

router.delete('/products/:id', catchAsync(async (req, res) => {
  await query('DELETE FROM products WHERE id = $1', [req.params.id]);
  sendSuccess(res, 200, 'Product deleted.');
}));

router.get('/vendors/all', catchAsync(async (req, res) => {
  const result = await query(
    `SELECT v.id, v.store_name,
       u.first_name || ' ' || u.last_name AS owner_name
     FROM vendors v
     JOIN users u ON v.user_id = u.id
     WHERE v.status = 'approved'
     ORDER BY v.store_name`
  );
  sendSuccess(res, 200, 'Vendors fetched.', { vendors: result.rows });
}));

router.post('/users', catchAsync(async (req, res, next) => {
  const bcrypt = require('bcryptjs');
  const { firstName, lastName, email, password, role, phone } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return next(new AppError(
      'firstName, lastName, email, password and role are required.', 400
    ));
  }

  const existing = await query(
    'SELECT id FROM users WHERE email = $1', [email]
  );
  if (existing.rows.length > 0) {
    return next(new AppError('Email already in use.', 400));
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users
       (first_name, last_name, email, password_hash, role, phone,
        is_verified, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,true,true)
     RETURNING id, first_name, last_name, email, role, phone,
               is_active, created_at`,
    [firstName, lastName, email, passwordHash, role, phone || null]
  );

  if (role === 'vendor') {
    await query(
      `INSERT INTO vendors (user_id, store_name, store_description, status)
       VALUES ($1, $2, $3, 'approved')`,
      [
        result.rows[0].id,
        `${firstName}'s Store`,
        'Store created by admin.'
      ]
    );
  }

  sendSuccess(res, 201, 'User created.', { user: result.rows[0] });
}));

router.delete('/users/:id', catchAsync(async (req, res, next) => {
  if (req.params.id === String(req.user.id)) {
    return next(new AppError('You cannot delete your own account.', 400));
  }

  const userCheck = await query(
    'SELECT id FROM users WHERE id = $1', [req.params.id]
  );
  if (userCheck.rows.length === 0) {
    return next(new AppError('User not found.', 404));
  }

  await query(
    `UPDATE users SET is_active = false WHERE id = $1`,
    [req.params.id]
  );

  sendSuccess(res, 200, 'User deactivated successfully.');
}));

router.patch('/users/:id/role', catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const validRoles = ['customer', 'vendor', 'admin'];

  if (!validRoles.includes(role)) {
    return next(new AppError(
      'Invalid role. Must be customer, vendor or admin.', 400
    ));
  }

  if (req.params.id === String(req.user.id)) {
    return next(new AppError('You cannot change your own role.', 400));
  }

  const userResult = await query(
    `UPDATE users SET role = $1
     WHERE id = $2
     RETURNING id, first_name, last_name, email, role`,
    [role, req.params.id]
  );

  if (userResult.rows.length === 0) {
    return next(new AppError('User not found.', 404));
  }

  if (role === 'vendor') {
    const vendorExists = await query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [req.params.id]
    );
    if (vendorExists.rows.length === 0) {
      const user = userResult.rows[0];
      await query(
        `INSERT INTO vendors (user_id, store_name, store_description, status)
         VALUES ($1, $2, $3, 'pending')`,
        [
          req.params.id,
          `${user.first_name}'s Store`,
          'Store created by admin role upgrade.'
        ]
      );
    }
  }

  sendSuccess(res, 200, 'User role updated.', {
    user: userResult.rows[0]
  });
}));

router.patch('/users/:id/reset-password', catchAsync(async (req, res, next) => {
  const bcrypt = require('bcryptjs');
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return next(new AppError('Password must be at least 6 characters.', 400));
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await query(
    `UPDATE users SET password_hash = $1 WHERE id = $2`,
    [passwordHash, req.params.id]
  );

  sendSuccess(res, 200, 'Password reset successfully.');
}));

router.get('/reviews', catchAsync(async (req, res) => {
  const { search = '', page = 1, limit = 15, flagged } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(p.name ILIKE $${params.length} OR
        u.first_name ILIKE $${params.length} OR
        u.last_name ILIKE $${params.length})`
    );
  }
  if (flagged === 'true') {
    conditions.push(`r.is_flagged = true`);
  }

  const where = conditions.length
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const result = await query(
    `SELECT
       r.id, r.rating, r.title, r.body,
       r.is_flagged, r.created_at,
       p.name AS product_name,
       p.id AS product_id,
       u.first_name || ' ' || u.last_name AS reviewer_name,
       u.email AS reviewer_email
     FROM reviews r
     JOIN products p ON r.product_id = p.id
     JOIN users u ON r.user_id = u.id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM reviews r
     JOIN products p ON r.product_id = p.id
     JOIN users u ON r.user_id = u.id
     ${where}`,
    params
  );

  sendSuccess(res, 200, 'Reviews fetched.', {
    reviews: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(
        parseInt(countResult.rows[0].count) / limit
      )
    }
  });
}));

router.delete('/reviews/:id', catchAsync(async (req, res, next) => {
  const check = await query(
    'SELECT id FROM reviews WHERE id = $1', [req.params.id]
  );
  if (check.rows.length === 0) {
    return next(new AppError('Review not found.', 404));
  }
  await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  sendSuccess(res, 200, 'Review deleted.');
}));

router.patch('/reviews/:id/flag', catchAsync(async (req, res, next) => {
  const result = await query(
    `UPDATE reviews SET is_flagged = NOT is_flagged
     WHERE id = $1 RETURNING id, is_flagged`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return next(new AppError('Review not found.', 404));
  }
  sendSuccess(res, 200, 'Review flag toggled.', {
    review: result.rows[0]
  });
}));

router.get('/vendors/:id', catchAsync(async (req, res, next) => {
  const result = await query(
    `SELECT
       v.*,
       u.first_name || ' ' || u.last_name AS owner_name,
       u.email AS owner_email,
       u.phone AS owner_phone,
       u.created_at AS owner_joined,
       COUNT(DISTINCT p.id) AS total_products,
       COUNT(DISTINCT o.id) AS total_orders,
       COALESCE(SUM(oi.total_price), 0) AS total_revenue
     FROM vendors v
     JOIN users u ON v.user_id = u.id
     LEFT JOIN products p ON p.vendor_id = v.id
     LEFT JOIN order_items oi ON oi.vendor_id = v.id
     LEFT JOIN orders o ON oi.order_id = o.id
       AND o.payment_status = 'paid'
     WHERE v.id = $1
     GROUP BY v.id, u.first_name, u.last_name,
              u.email, u.phone, u.created_at`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return next(new AppError('Vendor not found.', 404));
  }
  sendSuccess(res, 200, 'Vendor fetched.', { vendor: result.rows[0] });
}));

router.get('/orders/:id', catchAsync(async (req, res, next) => {
  const orderResult = await query(
    `SELECT
       o.*,
       u.first_name || ' ' || u.last_name AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (orderResult.rows.length === 0) {
    return next(new AppError('Order not found.', 404));
  }

  const itemsResult = await query(
    `SELECT
       oi.*,
       p.name AS product_name,
       p.slug AS product_slug,
       v.store_name AS vendor_name,
       (SELECT image_url FROM product_images
        WHERE product_id = p.id AND is_primary = true
        LIMIT 1) AS product_image
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN vendors v ON oi.vendor_id = v.id
     WHERE oi.order_id = $1`,
    [req.params.id]
  );

  sendSuccess(res, 200, 'Order fetched.', {
    order: orderResult.rows[0],
    items: itemsResult.rows
  });
}));

router.get('/notifications', catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT
       n.*,
       u.first_name || ' ' || u.last_name AS recipient_name,
       u.email AS recipient_email,
       u.role AS recipient_role
     FROM notifications n
     JOIN users u ON n.user_id = u.id
     ORDER BY n.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM notifications'
  );

  sendSuccess(res, 200, 'Notifications fetched.', {
    notifications: result.rows,
    pagination: {
      page: parseInt(page), limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(
        parseInt(countResult.rows[0].count) / limit
      )
    }
  });
}));

router.post('/notifications/send', catchAsync(async (req, res, next) => {
  const { type, title, message, userId, role } = req.body;

  if (!title || !message) {
    return next(new AppError('Title and message are required.', 400));
  }
  if (!type || !['user', 'broadcast', 'role'].includes(type)) {
    return next(new AppError(
      'type must be user, broadcast or role.', 400
    ));
  }
  if (type === 'user' && !userId) {
    return next(new AppError(
      'userId is required for user notifications.', 400
    ));
  }
  if (type === 'role' && !role) {
    return next(new AppError(
      'role is required for role-based notifications.', 400
    ));
  }

  let recipients = [];

  if (type === 'user') {
    const userCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
    if (userCheck.rows.length === 0) {
      return next(new AppError('User not found.', 404));
    }
    recipients = [{ id: userId }];
  } else if (type === 'broadcast') {
    const usersResult = await query(
      'SELECT id FROM users WHERE is_active = true'
    );
    recipients = usersResult.rows;
  } else if (type === 'role') {
    const usersResult = await query(
      'SELECT id FROM users WHERE role = $1 AND is_active = true',
      [role]
    );
    recipients = usersResult.rows;
  }

  if (recipients.length === 0) {
    return next(new AppError('No users found for this target.', 404));
  }

  for (const recipient of recipients) {
    await query(
      `INSERT INTO notifications
         (user_id, title, message, type, is_read)
       VALUES ($1, $2, $3, 'info', false)`,
      [recipient.id, title, message]
    );
  }

  sendSuccess(res, 201,
    `Notification sent to ${recipients.length} user(s).`, {
      sent: recipients.length
    }
  );
}));

router.delete('/notifications/:id', catchAsync(async (req, res) => {
  await query(
    'DELETE FROM notifications WHERE id = $1', [req.params.id]
  );
  sendSuccess(res, 200, 'Notification deleted.');
}));

router.put('/products/:id', catchAsync(async (req, res, next) => {
  const {
    vendorId, name, description, shortDescription,
    categoryId, basePrice, discountPrice,
    stockQuantity, sku, isFeatured, isActive,
    images, variants
  } = req.body;

  if (!name || !categoryId || !basePrice || !stockQuantity) {
    return next(new AppError(
      'name, categoryId, basePrice and stockQuantity are required.', 400
    ));
  }

  const existing = await query(
    'SELECT id FROM products WHERE id = $1', [req.params.id]
  );
  if (existing.rows.length === 0) {
    return next(new AppError('Product not found.', 404));
  }

  const productResult = await query(
    `UPDATE products SET
       name = $1,
       description = $2,
       short_description = $3,
       category_id = $4,
       base_price = $5,
       discount_price = $6,
       stock_quantity = $7,
       sku = $8,
       is_featured = $9,
       is_active = $10
       ${vendorId ? ', vendor_id = $11' : ''}
     WHERE id = ${vendorId ? '$12' : '$11'}
     RETURNING *`,
    vendorId
      ? [
          name, description || '', shortDescription || '',
          categoryId, basePrice, discountPrice || null,
          stockQuantity, sku || null, isFeatured || false,
          isActive !== undefined ? isActive : true,
          vendorId, req.params.id
        ]
      : [
          name, description || '', shortDescription || '',
          categoryId, basePrice, discountPrice || null,
          stockQuantity, sku || null, isFeatured || false,
          isActive !== undefined ? isActive : true,
          req.params.id
        ]
  );

  const product = productResult.rows[0];

  if (images && images.length > 0) {
    await query(
      'DELETE FROM product_images WHERE product_id = $1',
      [req.params.id]
    );
    for (const img of images) {
      await query(
        `INSERT INTO product_images (product_id, image_url, is_primary)
         VALUES ($1, $2, $3)`,
        [product.id, img.url, img.isPrimary || false]
      );
    }
  }

  if (variants !== undefined) {
    await query(
      'DELETE FROM product_variants WHERE product_id = $1',
      [req.params.id]
    );

    for (const v of variants) {
      if (!v.name) continue;

      let attrs = v.attributes || {};
      if (typeof attrs === 'string') {
        try { attrs = JSON.parse(attrs); } catch { attrs = {}; }
      }

      await query(
        `INSERT INTO product_variants
           (product_id, variant_name, price, stock_quantity, sku, attributes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.params.id,
          v.name,               
          v.price || null,
          v.stockQuantity || 0,
          v.sku || null,
          JSON.stringify(attrs) 
        ]
      );
    }
  }

  sendSuccess(res, 200, 'Product updated successfully.', { product });
}));

router.get('/products/:id', catchAsync(async (req, res, next) => {
  const productResult = await query(
    `SELECT
       p.*,
       c.name AS category_name,
       v.store_name AS vendor_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN vendors v ON p.vendor_id = v.id
     WHERE p.id = $1`,
    [req.params.id]
  );

  if (productResult.rows.length === 0) {
    return next(new AppError('Product not found.', 404));
  }

  const imagesResult = await query(
    `SELECT id, image_url, is_primary
     FROM product_images
     WHERE product_id = $1
     ORDER BY is_primary DESC`,
    [req.params.id]
  );

  const variantsResult = await query(
    `SELECT id, variant_name AS name, price,
            stock_quantity, sku, attributes
     FROM product_variants
     WHERE product_id = $1
     ORDER BY created_at ASC`,
    [req.params.id]
  );

  const variants = variantsResult.rows.map(v => ({
    ...v,
    attributes: typeof v.attributes === 'string'
      ? (() => {
          try { return JSON.parse(v.attributes); }
          catch { return {}; }
        })()
      : (v.attributes || {})
  }));

  sendSuccess(res, 200, 'Product fetched.', {
    product: {
      ...productResult.rows[0],
      images: imagesResult.rows,
      variants
    }
  });
}));


// ─────────────────────────────────────────────
// CAROUSEL MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/v1/admin/carousel
router.get('/carousel', catchAsync(async (req, res) => {
  const result = await query(
    `SELECT * FROM carousel_slides ORDER BY sort_order ASC, created_at ASC`
  );
  sendSuccess(res, 200, 'Carousel slides fetched.', { slides: result.rows });
}));

// POST /api/v1/admin/carousel
router.post('/carousel', catchAsync(async (req, res) => {
  const { imageUrl, headline, description, badge, buttonText, link, position, sortOrder } = req.body;
  if (!imageUrl) return res.status(400).json({ success: false, message: 'Image URL is required.' });

  const result = await query(
    `INSERT INTO carousel_slides (image_url, headline, description, badge, button_text, link, position, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [imageUrl, headline || null, description || null, badge || null,
     buttonText || 'Shop Now', link || '/products',
     position || 'left', sortOrder || 0]
  );
  sendSuccess(res, 201, 'Slide created.', { slide: result.rows[0] });
}));

// PATCH /api/v1/admin/carousel/:id
router.patch('/carousel/:id', catchAsync(async (req, res) => {
  const { imageUrl, headline, description, badge, buttonText, link, position, sortOrder, isActive } = req.body;
  const fields = [];
  const values = [];
  let p = 1;

  if (imageUrl     !== undefined) { fields.push(`image_url=$${p++}`);    values.push(imageUrl); }
  if (headline     !== undefined) { fields.push(`headline=$${p++}`);     values.push(headline); }
  if (description  !== undefined) { fields.push(`description=$${p++}`);  values.push(description); }
  if (badge        !== undefined) { fields.push(`badge=$${p++}`);        values.push(badge); }
  if (buttonText   !== undefined) { fields.push(`button_text=$${p++}`);  values.push(buttonText); }
  if (link         !== undefined) { fields.push(`link=$${p++}`);         values.push(link); }
  if (position     !== undefined) { fields.push(`position=$${p++}`);     values.push(position); }
  if (sortOrder    !== undefined) { fields.push(`sort_order=$${p++}`);   values.push(sortOrder); }
  if (isActive     !== undefined) { fields.push(`is_active=$${p++}`);    values.push(isActive); }

  fields.push(`updated_at=NOW()`);
  values.push(req.params.id);

  const result = await query(
    `UPDATE carousel_slides SET ${fields.join(',')} WHERE id=$${p} RETURNING *`,
    values
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Slide not found.' });
  sendSuccess(res, 200, 'Slide updated.', { slide: result.rows[0] });
}));

// DELETE /api/v1/admin/carousel/:id
router.delete('/carousel/:id', catchAsync(async (req, res) => {
  const result = await query(
    `DELETE FROM carousel_slides WHERE id=$1 RETURNING id`, [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Slide not found.' });
  sendSuccess(res, 200, 'Slide deleted.');
}));

module.exports = router;
