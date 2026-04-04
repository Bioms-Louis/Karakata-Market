const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');
const generateTokens = require('../../utils/generateToken');

const registerUser = async ({ email, password, firstName, lastName, phone }) => {
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('An account with this email already exists.', 400);
  }

 const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name, last_name, phone, role, created_at`,
    [email.toLowerCase().trim(), passwordHash, firstName, lastName, phone || null]
  );

  const newUser = result.rows[0];

  const tokens = generateTokens(newUser.id, newUser.role);

  return { user: newUser, tokens };
};

const loginUser = async ({ email, password }) => {
  const result = await query(
    `SELECT id, email, password_hash, first_name, last_name, 
            role, is_active, avatar_url
     FROM users 
     WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  const user = result.rows[0];
  const isPasswordValid = user
    ? await bcrypt.compare(password, user.password_hash)
    : false;

  if (!user || !isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.is_active) {
    throw new AppError(
      'Your account has been deactivated. Please contact support.',
      401
    );
  }

  const tokens = generateTokens(user.id, user.role);

  const { password_hash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  const user = result.rows[0];
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password_hash
  );

  if (!isCurrentPasswordValid) {
    throw new AppError('Your current password is incorrect.', 400);
  }
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );

  return { message: 'Password changed successfully' };
};

module.exports = { registerUser, loginUser, changePassword };