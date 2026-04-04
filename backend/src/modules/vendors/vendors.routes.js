const express = require('express');
const router = express.Router();
const vendorController = require('./vendors.controller');
const { protect } = require('../../middleware/auth');
const { restrictTo } = require('../../middleware/roleCheck');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');
const { query } = require('../../config/database');

router.get('/:id', vendorController.getVendorProfile);


// POST /api/v1/vendors/apply
// Public — creates a new user account AND vendor application in one step
router.post('/apply', catchAsync(async (req, res, next) => {
  const bcrypt = require('bcryptjs');
  const {
    // Account info
    firstName, lastName, email, password,
    // Store info
    storeName, storeDescription, businessEmail, businessPhone,
    businessAddress,
    // Bank info
    bankName, accountNumber, accountName
  } = req.body;

  if (!firstName || !lastName || !email || !password || !storeName) {
    return next(new AppError('Please fill in all required fields.', 400));
  }

  // Check if email already registered
  const emailCheck = await query(
    'SELECT id FROM users WHERE email = $1', [email]
  );
  if (emailCheck.rows.length > 0) {
    return next(new AppError('An account with this email already exists. Please log in instead.', 400));
  }

  // Check store name taken
  const nameCheck = await query(
    'SELECT id FROM vendors WHERE store_name = $1', [storeName]
  );
  if (nameCheck.rows.length > 0) {
    return next(new AppError('This store name is already taken.', 400));
  }

  const client = await require('../../config/database').getClient();
  try {
    await client.query('BEGIN');

    // 1. Create user account with vendor role
    const hashedPassword = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'vendor') RETURNING id, first_name, last_name, email, role`,
      [firstName, lastName, email, hashedPassword]
    );
    const newUser = userResult.rows[0];

    // 2. Create vendor application (status defaults to 'pending')
    const vendorResult = await client.query(
      `INSERT INTO vendors
         (user_id, store_name, store_description, business_email, business_phone,
          business_address, bank_name, account_number, account_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, store_name, status`,
      [newUser.id, storeName, storeDescription || null,
       businessEmail || email, businessPhone || null,
       businessAddress || null, bankName || null,
       accountNumber || null, accountName || null]
    );

    await client.query('COMMIT');

    sendSuccess(res, 201, 'Application submitted! Please wait for admin approval.', {
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
      vendor: vendorResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

router.post('/register', protect, vendorController.registerVendor);

router.get('/dashboard', protect, restrictTo('vendor'), vendorController.getVendorDashboard);

router.get('/orders', protect, restrictTo('vendor'), catchAsync(async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;

  const vendorResult = await query(
    'SELECT id FROM vendors WHERE user_id = $1',
    [req.user.id]
  );

  if (vendorResult.rows.length === 0) {
    return next(new AppError('Vendor not found.', 404));
  }

  const vendorId = vendorResult.rows[0].id;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE oi.vendor_id = $1';
  const params = [vendorId];

  if (status) {
    params.push(status);
    whereClause += ` AND o.status = $${params.length}`;
  }

  const ordersResult = await query(
    `SELECT DISTINCT
       o.id, o.order_number, o.status, o.total_amount,
       o.created_at,
       u.first_name || ' ' || u.last_name AS customer_name,
       COUNT(oi.id) OVER (PARTITION BY o.id) AS item_count,
       SUM(oi.total_price) OVER (PARTITION BY o.id) AS vendor_total
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN users u ON o.user_id = u.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(DISTINCT o.id) as total
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total);

  sendSuccess(res, 200, 'Orders fetched.', {
    orders: ordersResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.patch('/orders/:orderId/status', protect, restrictTo('vendor'),
  catchAsync(async (req, res, next) => {
    const { status } = req.body;
    const { orderId } = req.params;

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped'],
      shipped: ['delivered'],
    };

    const orderResult = await query(
      'SELECT status FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return next(new AppError('Order not found.', 404));
    }

    const currentStatus = orderResult.rows[0].status;
    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(status)) {
      return next(
        new AppError(
          `Cannot move order from ${currentStatus} to ${status}.`, 400
        )
      );
    }

    await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, orderId]
    );

    sendSuccess(res, 200, 'Order status updated.');
  })
);

// GET /api/v1/vendors/profile
router.get('/profile', protect, restrictTo('vendor'), catchAsync(async (req, res) => {
  const userResult = await query(
    `SELECT id, first_name, last_name, email, phone FROM users WHERE id = $1`,
    [req.user.id]
  );
  const vendorResult = await query(
    `SELECT id, store_name, store_description, store_email, store_phone,
            store_address, logo_url, status, notification_prefs
     FROM vendors WHERE user_id = $1`,
    [req.user.id]
  );
  const user = userResult.rows[0];
  const vendor = vendorResult.rows[0];
  sendSuccess(res, 200, 'Profile fetched.', {
    profile: {
      ...user,
      vendor,
      notificationPrefs: vendor?.notification_prefs || {}
    }
  });
}));

// PATCH /api/v1/vendors/profile/personal
router.patch('/profile/personal', protect, restrictTo('vendor'), catchAsync(async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  await query(
    `UPDATE users SET first_name=$1, last_name=$2, email=$3, phone=$4,
     updated_at=NOW() WHERE id=$5`,
    [firstName, lastName, email, phone || null, req.user.id]
  );
  sendSuccess(res, 200, 'Personal info updated.');
}));

// PATCH /api/v1/vendors/profile/store
router.patch('/profile/store', protect, restrictTo('vendor'), catchAsync(async (req, res) => {
  const { storeName, storeDescription, storeEmail, storePhone, storeAddress, logoUrl } = req.body;
  await query(
    `UPDATE vendors SET store_name=$1, store_description=$2, store_email=$3,
     store_phone=$4, store_address=$5, logo_url=$6, updated_at=NOW()
     WHERE user_id=$7`,
    [storeName, storeDescription || null, storeEmail || null,
     storePhone || null, storeAddress || null, logoUrl || null, req.user.id]
  );
  sendSuccess(res, 200, 'Store info updated.');
}));

// PATCH /api/v1/vendors/profile/password
router.patch('/profile/password', protect, restrictTo('vendor'), catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const bcrypt = require('bcryptjs');

  const userResult = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  );
  const user = userResult.rows[0];
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect.', 400));
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  await query(
    'UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2',
    [hashed, req.user.id]
  );
  sendSuccess(res, 200, 'Password changed successfully.');
}));

// PATCH /api/v1/vendors/profile/notifications
router.patch('/profile/notifications', protect, restrictTo('vendor'), catchAsync(async (req, res) => {
  await query(
    `UPDATE vendors SET notification_prefs=$1, updated_at=NOW() WHERE user_id=$2`,
    [JSON.stringify(req.body), req.user.id]
  );
  sendSuccess(res, 200, 'Notification preferences saved.');
}));


module.exports = router;