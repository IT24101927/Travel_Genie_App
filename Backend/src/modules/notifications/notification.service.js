const Notification = require('./notification.model');
const AppError = require('../../utils/appError');

const createNotification = async (payload) => {
  return Notification.create(payload);
};

const getUserNotifications = async (user) => {
  const filter = user.role === 'admin' ? {} : { userId: user.userId };
  return Notification.find(filter).sort({ createdAt: -1 });
};

const markAsRead = async (id, user) => {
  const filter = user.role === 'admin' ? { _id: id } : { _id: id, userId: user.userId };

  const notification = await Notification.findOne(filter);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

const deleteNotification = async (id, user) => {
  const filter = user.role === 'admin' ? { _id: id } : { _id: id, userId: user.userId };

  const notification = await Notification.findOne(filter);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  await notification.deleteOne();
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification
};
