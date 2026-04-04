const notificationService = require('./notifications.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/apiResponse');

const getNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.getUserNotifications(
    req.user.id, req.query
  );
  sendSuccess(res, 200, 'Notifications fetched successfully.', result);
});

const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id, req.user.id
  );
  sendSuccess(res, 200, 'Notification marked as read.', { notification });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  sendSuccess(res, 200, result.message);
});

const deleteNotification = catchAsync(async (req, res) => {
  const result = await notificationService.deleteNotification(
    req.params.id, req.user.id
  );
  sendSuccess(res, 200, result.message);
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};