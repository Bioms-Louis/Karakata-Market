const authService = require('./auth.service');
const { query } = require('../../config/database');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return next(new AppError('Please provide email, password, first name and last name.', 400));
  }

  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long.', 400));
  }

  const { user, tokens } = await authService.registerUser({
    email,
    password,
    firstName,
    lastName,
    phone
  });

  sendSuccess(res, 201, 'Account created successfully!', {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide your email and password.', 400));
  }

  const { user, tokens } = await authService.loginUser({ email, password });

  sendSuccess(res, 200, 'Login successful!', {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});

const getMe = catchAsync(async (req, res, next) => {
  const result = await query(
    `SELECT id, email, first_name, last_name, phone, 
            role, avatar_url, is_verified, created_at
     FROM users 
     WHERE id = $1`,
    [req.user.id]
  );

  const user = result.rows[0];

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  sendSuccess(res, 200, 'Profile fetched successfully.', { user });
});

// ─────────────────────────────────────────────
// PATCH /api/v1/(auth)/change-password  (protected)
// ─────────────────────────────────────────────
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password.', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters.', 400));
  }

  if (currentPassword === newPassword) {
    return next(new AppError('New password must be different from current password.', 400));
  }

  await authService.changePassword(req.user.id, { currentPassword, newPassword });

  sendSuccess(res, 200, 'Password changed successfully!');
});

module.exports = { register, login, getMe, changePassword };