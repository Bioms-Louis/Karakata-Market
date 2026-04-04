const { query } = require('../../config/database');
const AppError = require('../../utils/AppError');

const createNotification = async (userId, { title, message, type, link }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, title, message, type, link || null]
  );

  return result.rows[0];
};

const getUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [notificationsResult, countResult, unreadResult] = await Promise.all([
    query(
      `SELECT id, title, message, type, link, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    ),
    query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
      [userId]
    ),
    query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    )
  ]);

  const total = parseInt(countResult.rows[0].total);

  return {
    notifications: notificationsResult.rows,
    unreadCount: parseInt(unreadResult.rows[0].unread),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const markAsRead = async (notificationId, userId) => {
  const result = await query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found.', 404);
  }

  return result.rows[0];
};

const markAllAsRead = async (userId) => {
  await query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return { message: 'All notifications marked as read.' };
};

const deleteNotification = async (notificationId, userId) => {
  const result = await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found.', 404);
  }

  return { message: 'Notification deleted.' };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};