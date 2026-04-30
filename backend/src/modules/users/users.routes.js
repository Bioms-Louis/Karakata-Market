// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILE ROUTES
// Add these to your users routes file OR create a new file:
// src/modules/users/users.routes.js
// Then register in app.js: app.use('/api/v1/users', require('./src/modules/users/users.routes'));
// ─────────────────────────────────────────────────────────────────────────────

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
// Returns saved addresses (mobile profile screen)
router.get('/me/addresses', catchAsync(async (req, res) => {
    const result = await query(
        `SELECT * FROM user_addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
        [req.user.id]
    );
    sendSuccess(res, 200, 'Addresses fetched.', { addresses: result.rows });
}));


// ─────────────────────────────────────────────────────────────────────────────
// ADDRESS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/users/addresses
router.get('/addresses', catchAsync(async (req, res) => {
    const result = await query(
        `SELECT * FROM user_addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
        [req.user.id]
    );
    sendSuccess(res, 200, 'Addresses fetched.', { addresses: result.rows });
}));

// POST /api/v1/users/addresses
router.post('/addresses', catchAsync(async (req, res, next) => {
    const { fullName, phone, address, city, state, label, isDefault } = req.body;

    if (!fullName || !phone || !address || !city || !state) {
        return next(new AppError('Full name, phone, address, city and state are required.', 400));
    }

    const client = await require('../../config/database').getClient();
    try {
        await client.query('BEGIN');

        // If this is default, unset other defaults first
        if (isDefault) {
            await client.query(
                'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
                [req.user.id]
            );
        }

        // If this is the user's first address, make it default automatically
        const countResult = await client.query(
            'SELECT COUNT(*) FROM user_addresses WHERE user_id = $1',
            [req.user.id]
        );
        const isFirstAddress = parseInt(countResult.rows[0].count) === 0;

        const result = await client.query(
            `INSERT INTO user_addresses
         (user_id, full_name, phone, address, city, state, label, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
            [req.user.id, fullName, phone, address, city, state,
                label || 'Home', isDefault || isFirstAddress]
        );

        await client.query('COMMIT');
        sendSuccess(res, 201, 'Address saved.', { address: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}));

// PATCH /api/v1/users/addresses/:id
router.patch('/addresses/:id', catchAsync(async (req, res, next) => {
    const { fullName, phone, address, city, state, label, isDefault } = req.body;

    // Confirm belongs to user
    const existing = await query(
        'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) {
        return next(new AppError('Address not found.', 404));
    }

    const client = await require('../../config/database').getClient();
    try {
        await client.query('BEGIN');

        if (isDefault) {
            await client.query(
                'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
                [req.user.id]
            );
        }

        const result = await client.query(
            `UPDATE user_addresses
       SET full_name=$1, phone=$2, address=$3, city=$4,
           state=$5, label=$6, is_default=$7, updated_at=NOW()
       WHERE id=$8 AND user_id=$9
       RETURNING *`,
            [fullName, phone, address, city, state,
                label || 'Home', isDefault || false,
                req.params.id, req.user.id]
        );

        await client.query('COMMIT');
        sendSuccess(res, 200, 'Address updated.', { address: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}));

// PATCH /api/v1/users/addresses/:id/default
router.patch('/addresses/:id/default', catchAsync(async (req, res, next) => {
    const existing = await query(
        'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );
    if (existing.rows.length === 0) {
        return next(new AppError('Address not found.', 404));
    }

    const client = await require('../../config/database').getClient();
    try {
        await client.query('BEGIN');
        await client.query(
            'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
            [req.user.id]
        );
        const result = await client.query(
            `UPDATE user_addresses SET is_default = true, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        await client.query('COMMIT');
        sendSuccess(res, 200, 'Default address updated.', { address: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}));

// DELETE /api/v1/users/addresses/:id
router.delete('/addresses/:id', catchAsync(async (req, res, next) => {
    const result = await query(
        'DELETE FROM user_addresses WHERE id=$1 AND user_id=$2 RETURNING id, is_default',
        [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
        return next(new AppError('Address not found.', 404));
    }

    // If deleted address was default, make the next one default
    if (result.rows[0].is_default) {
        await query(
            `UPDATE user_addresses SET is_default = true
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
            [req.user.id]
        );
    }

    sendSuccess(res, 200, 'Address deleted.');
}));

module.exports = router;