const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification
} = require('./notification.service');

const createNotificationHandler = asyncHandler(async (req, res) => {
  const notification = await createNotification(req.body);
  return sendSuccess(res, 201, 'Notification created successfully', { notification });
});

const getNotificationsHandler = asyncHandler(async (req, res) => {
  const notifications = await getUserNotifications(req.user);
  return sendSuccess(res, 200, 'Notifications fetched successfully', { notifications });
});

const markAsReadHandler = asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.params.id, req.user);
  return sendSuccess(res, 200, 'Notification marked as read', { notification });
});

const deleteNotificationHandler = asyncHandler(async (req, res) => {
  await deleteNotification(req.params.id, req.user);
  return sendSuccess(res, 200, 'Notification deleted successfully');
});

module.exports = {
  createNotificationHandler,
  getNotificationsHandler,
  markAsReadHandler,
  deleteNotificationHandler
};
