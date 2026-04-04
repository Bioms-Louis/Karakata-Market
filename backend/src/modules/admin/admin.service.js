const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');

const getDashboardStats = async () => {
  const [
    usersResult,
    vendorsResult,
    productsResult,
    ordersResult,
    revenueResult,
    recentOrdersResult,
    pendingVendorsResult
  ] = await Promise.all([
    query(`SELECT COUNT(*) as total FROM users WHERE role = 'customer'`),

    query(
      `SELECT status, COUNT(*) as count
       FROM vendors GROUP BY status`
    ),

    query(`SELECT COUNT(*) as total FROM products WHERE is_active = true`),

    query(
      `SELECT status, COUNT(*) as count
       FROM orders GROUP BY status`
    ),

    query(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM orders WHERE payment_status = 'paid'`
    ),

    query(
      `SELECT
         o.id, o.order_number, o.status,
         o.payment_status, o.total_amount, o.created_at,
         u.first_name, u.last_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    ),

    query(
      `SELECT
         v.id, v.store_name, v.created_at,
         u.first_name, u.last_name, u.email
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.status = 'pending'
       ORDER BY v.created_at ASC`
    )
  ]);

  const vendorStats = { pending: 0, approved: 0, rejected: 0, suspended: 0 };
  vendorsResult.rows.forEach(row => {
    vendorStats[row.status] = parseInt(row.count);
  });

  const orderStats = {};
  ordersResult.rows.forEach(row => {
    orderStats[row.status] = parseInt(row.count);
  });

  return {
    overview: {
      totalCustomers: parseInt(usersResult.rows[0].total),
      totalRevenue: parseFloat(revenueResult.rows[0].total),
      totalProducts: parseInt(productsResult.rows[0].total),
      totalOrders: Object.values(orderStats).reduce((a, b) => a + b, 0)
    },
    vendorStats,
    orderStats,
    recentOrders: recentOrdersResult.rows,
    pendingVendors: pendingVendorsResult.rows
  };
};

const getAllVendors = async ({ page = 1, limit = 20, status }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (status) {
    conditions.push(`v.status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [vendorsResult, countResult] = await Promise.all([
    query(
      `SELECT
         v.id, v.store_name, v.status, v.total_sales,
         v.rating, v.created_at,
         u.first_name, u.last_name, u.email, u.phone,
         COUNT(p.id) AS product_count
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       LEFT JOIN products p ON v.id = p.vendor_id AND p.is_active = true
       ${whereClause}
       GROUP BY v.id, u.id
       ORDER BY v.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, parseInt(limit), offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM vendors v ${whereClause}`,
      values
    )
  ]);

  const total = parseInt(countResult.rows[0].total);

  return {
    vendors: vendorsResult.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const updateVendorStatus = async (vendorId, { status, rejectionReason }) => {
  const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status value.', 400);
  }

  if (status === 'rejected' && !rejectionReason) {
    throw new AppError('Please provide a rejection reason.', 400);
  }

  const result = await query(
    `UPDATE vendors
     SET status = $1,
         rejection_reason = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, rejectionReason || null, vendorId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Vendor not found.', 404);
  }

  if (status === 'approved') {
    const vendorUser = await query(
      'SELECT user_id FROM vendors WHERE id = $1',
      [vendorId]
    );

    if (vendorUser.rows.length > 0) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          vendorUser.rows[0].user_id,
          'Vendor Application Approved! 🎉',
          'Congratulations! Your vendor application has been approved. You can now start adding products.',
          'vendor'
        ]
      );
    }
  }

  if (status === 'rejected') {
    const vendorUser = await query(
      'SELECT user_id FROM vendors WHERE id = $1',
      [vendorId]
    );

    if (vendorUser.rows.length > 0) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          vendorUser.rows[0].user_id,
          'Vendor Application Update',
          `Your vendor application was not approved. Reason: ${rejectionReason}`,
          'vendor'
        ]
      );
    }
  }

  return result.rows[0];
};

const getAllUsers = async ({ page = 1, limit = 20, role, search }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (role) {
    conditions.push(`role = $${paramCount}`);
    values.push(role);
    paramCount++;
  }

  if (search) {
    conditions.push(
      `(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`
    );
    values.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [usersResult, countResult] = await Promise.all([
    query(
      `SELECT id, email, first_name, last_name, phone, role,
              is_active, is_verified, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, parseInt(limit), offset]
    ),
    query(`SELECT COUNT(*) as total FROM users ${whereClause}`, values)
  ]);

  const total = parseInt(countResult.rows[0].total);

  return {
    users: usersResult.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const updateUserStatus = async (userId, { isActive }) => {
  const result = await query(
    `UPDATE users
     SET is_active = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, first_name, last_name, role, is_active`,
    [isActive, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  return result.rows[0];
};

const getAllOrders = async ({ page = 1, limit = 20, status, paymentStatus }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (status) {
    conditions.push(`o.status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }

  if (paymentStatus) {
    conditions.push(`o.payment_status = $${paramCount}`);
    values.push(paymentStatus);
    paramCount++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [ordersResult, countResult] = await Promise.all([
    query(
      `SELECT
         o.id, o.order_number, o.status, o.payment_status,
         o.subtotal, o.shipping_fee, o.total_amount,
         o.created_at,
         u.first_name, u.last_name, u.email,
         COUNT(oi.id) AS item_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, parseInt(limit), offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      values
    )
  ]);

  const total = parseInt(countResult.rows[0].total);

  return {
    orders: ordersResult.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const updateOrderStatus = async (orderId, { status }) => {
  const validStatuses = [
    'pending', 'confirmed', 'processing',
    'shipped', 'delivered', 'cancelled', 'refunded'
  ];

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid order status.', 400);
  }

  const result = await query(
    `UPDATE orders
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, orderId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Order not found.', 404);
  }

  const order = result.rows[0];
  await query(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      order.user_id,
      'Order Status Update',
      `Your order ${order.order_number} status has been updated to: ${status}.`,
      'order',
      `/orders/${order.id}`
    ]
  );

  return order;
};

const adminDeleteProduct = async (productId) => {
  const result = await query(
    `UPDATE products
     SET is_active = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name`,
    [productId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Product not found.', 404);
  }

  return { message: `Product "${result.rows[0].name}" has been removed.` };
};

module.exports = {
  getDashboardStats,
  getAllVendors,
  updateVendorStatus,
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  updateOrderStatus,
  adminDeleteProduct
};