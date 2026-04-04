const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');

const getUserAddresses = async (userId) => {
  const result = await query(
    `SELECT * FROM user_addresses 
     WHERE user_id = $1 
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
};

const addAddress = async (userId, addressData) => {
  const {
    label, fullName, phone,
    address, city, state, country = 'Nigeria',
    isDefault = false
  } = addressData;

  if (isDefault) {
    await query(
      'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
      [userId]
    );
  }

  const existingCount = await query(
    'SELECT COUNT(*) FROM user_addresses WHERE user_id = $1',
    [userId]
  );

  const makeDefault = isDefault || parseInt(existingCount.rows[0].count) === 0;

  const result = await query(
    `INSERT INTO user_addresses 
       (user_id, label, full_name, phone, address, city, state, country, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [userId, label || 'Home', fullName, phone,
     address, city, state, country, makeDefault]
  );

  return result.rows[0];
};

const setDefaultAddress = async (userId, addressId) => {
 
  await query(
    'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
    [userId]
  );

  const result = await query(
    `UPDATE user_addresses 
     SET is_default = true 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [addressId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Address not found.', 404);
  }

  return result.rows[0];
};

const deleteAddress = async (userId, addressId) => {
  const result = await query(
    'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id',
    [addressId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Address not found.', 404);
  }

  return { message: 'Address deleted.' };
};

module.exports = {
  getUserAddresses,
  addAddress,
  setDefaultAddress,
  deleteAddress
};