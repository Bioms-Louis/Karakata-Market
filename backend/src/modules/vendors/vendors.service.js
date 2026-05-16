const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');

const registerVendor = async (userId, vendorData) => {
  const {
    storeName, storeDescription, businessEmail, businessPhone,
    businessAddress, bankName, accountNumber, accountName
  } = vendorData;

  const existing = await query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [userId]
  );

  if (existing.rows.length > 0) {
    throw new AppError('You have already registered as a vendor.', 400);
  }

  const nameCheck = await query(
      'SELECT id FROM vendors WHERE store_name = $1',
      [storeName]
  );

  if (nameCheck.rows.length > 0) {
    throw new AppError('This store name is already taken.', 400);
  }

  const result = await query(
      `INSERT INTO vendors
       (user_id, store_name, store_description, business_email, business_phone,
        business_address, bank_name, account_number, account_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, store_name, status, created_at`,
      [userId, storeName, storeDescription || null, businessEmail || null,
        businessPhone || null, businessAddress || null,
        bankName || null, accountNumber || null, accountName || null]
  );

  await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      ['vendor', userId]
  );

  return result.rows[0];
};

const getVendorProfile = async (vendorId) => {
  const result = await query(
      `SELECT
         v.id, v.store_name, v.store_description, v.store_logo_url,
         v.store_banner_url, v.rating, v.total_sales,
         COUNT(p.id) AS product_count
       FROM vendors v
              LEFT JOIN products p ON v.id = p.vendor_id AND p.is_active = true
       WHERE v.id = $1 AND v.status = 'approved'
       GROUP BY v.id`,
      [vendorId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Vendor not found.', 404);
  }

  return result.rows[0];
};

const getVendorDashboard = async (userId) => {
  const vendorResult = await query(
      'SELECT id, store_name, status FROM vendors WHERE user_id = $1',
      [userId]
  );

  if (vendorResult.rows.length === 0) {
    throw new AppError('Vendor account not found.', 404);
  }

  const vendor = vendorResult.rows[0];

  const [
    productsResult,
    ordersResult,
    pendingOrdersResult,
    revenueResult,
    recentOrdersResult
  ] = await Promise.all([
    // Active product count
    query(
        'SELECT COUNT(*) as total FROM products WHERE vendor_id = $1 AND is_active = true',
        [vendor.id]
    ),
    // Total distinct orders
    query(
        'SELECT COUNT(DISTINCT order_id) as total FROM order_items WHERE vendor_id = $1',
        [vendor.id]
    ),
    // Pending orders
    query(
        `SELECT COUNT(DISTINCT oi.order_id) as total
         FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
         WHERE oi.vendor_id = $1 AND o.status = 'pending'`,
        [vendor.id]
    ),
    // Revenue from paid orders
    query(
        `SELECT COALESCE(SUM(oi.total_price), 0) as total
         FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
         WHERE oi.vendor_id = $1 AND o.payment_status = 'paid'`,
        [vendor.id]
    ),
    // Recent 5 orders with full info
    query(
        `SELECT DISTINCT
         o.id, o.order_number, o.created_at, o.status,
         u.first_name || ' ' || u.last_name AS customer_name,
         COUNT(oi.id) OVER (PARTITION BY o.id) AS item_count,
         SUM(oi.total_price) OVER (PARTITION BY o.id) AS vendor_total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE oi.vendor_id = $1
       ORDER BY o.created_at DESC
       LIMIT 5`,
        [vendor.id]
    )
  ]);

  return {
    vendor,
    vendorStatus: vendor.status,
    stats: {
      totalProducts: parseInt(productsResult.rows[0].total),
      totalOrders:   parseInt(ordersResult.rows[0].total),
      pendingOrders: parseInt(pendingOrdersResult.rows[0].total),
      totalRevenue:  parseFloat(revenueResult.rows[0].total),
    },
    recentOrders: recentOrdersResult.rows,
  };
};

module.exports = { registerVendor, getVendorProfile, getVendorDashboard };