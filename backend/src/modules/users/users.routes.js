// USER PROFILE ROUTES
const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const { query }  = require('../../config/database');
const { protect }= require('../../middleware/auth');
const AppError   = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/apiResponse');

// All routes require authentication
router.use(protect);

// GET /api/v1/users/me
// Returns the logged-in user's profile
router.get('/me', catchAsync(async (req, res) => {
    const result = await query(
        `SELECT id, first_name, last_name, email, phone, role, created_at
     FROM users WHERE id = $1`,
        [req.user.id]
    );
    sendSuccess(res, 200, 'Profile fetched.', { user: result.rows[0] });
}));

// PATCH /api/v1/users/me
// Update personal info (name, email, phone)
router.patch('/me', catchAsync(async (req, res, next) => {
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
        return next(new AppError('First name, last name and email are required.', 400));
    }

    // Check email not taken by another user
    const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
    );
    if (emailCheck.rows.length > 0) {
        return next(new AppError('That email is already in use by another account.', 400));
    }

    const result = await query(
        `UPDATE users
     SET first_name=$1, last_name=$2, email=$3, phone=$4, updated_at=NOW()
     WHERE id=$5
     RETURNING id, first_name, last_name, email, phone, role`,
        [firstName, lastName, email, phone || null, req.user.id]
    );

    sendSuccess(res, 200, 'Profile updated successfully.', { user: result.rows[0] });
}));

// PATCH /api/v1/users/me/password
// Change password
router.patch('/me/password', catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new AppError('Current and new password are required.', 400));
    }
    if (newPassword.length < 8) {
        return next(new AppError('New password must be at least 8 characters.', 400));
    }

    const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
    );
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
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

// GET /api/v1/users/me/addresses
// Returns unique shipping addresses from past orders (most recent first)
router.get('/me/addresses', catchAsync(async (req, res) => {
    const result = await query(
        `SELECT DISTINCT ON (shipping_address, shipping_city, shipping_state)
       shipping_name, shipping_phone, shipping_address,
       shipping_city, shipping_state, shipping_country,
       MAX(created_at) OVER (
         PARTITION BY shipping_address, shipping_city, shipping_state
       ) AS last_used
     FROM orders
     WHERE user_id = $1
     ORDER BY shipping_address, shipping_city, shipping_state, last_used DESC`,
        [req.user.id]
    );
    sendSuccess(res, 200, 'Addresses fetched.', { addresses: result.rows });
}));

module.exports = router;
