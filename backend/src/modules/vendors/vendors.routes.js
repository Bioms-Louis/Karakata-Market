const express = require('express');
const router = express.Router();
const vendorController = require('./vendors.controller');
const { protect } = require('../../middleware/auth');
const { restrictTo } = require('../../middleware/roleCheck');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');
const { query } = require('../../config/database');

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


// ⚠️  Wildcard MUST be last — otherwise it catches /dashboard, /profile etc.
router.get('/:id', vendorController.getVendorProfile);

module.exports = router;