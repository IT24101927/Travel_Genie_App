const Notification = require('./notification.model');
const AppError = require('../../utils/appError');

const createNotification = async (payload) => {
  const titles = {
    'BUDGET_100': 'Budget Exceeded 🚨',
    'BUDGET_80': 'Budget Warning ⚠️',
    'PRICE_UPDATE': 'Price Trend Update 📈',
    'REVIEW_FLAGGED': 'Review Flagged 🚩',
    'REVIEW_APPROVED': 'Review Approved ✅',
    'REVIEW_REJECTED': 'Review Update ℹ️',
  };
  if (!payload.title && payload.type) {
    payload.title = titles[payload.type] || 'New Notification';
  }
  return Notification.create(payload);
};

const getUserNotifications = async (user) => {
  // Admins see everything. Users only see non-deleted notifications assigned to them.
  const filter = user.role === 'admin' ? {} : { userId: user.userId, deletedByUser: false };
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

  if (user.role === 'admin') {
    // Admin performs a hard delete from the platform
    await notification.deleteOne();
  } else {
    // Regular user performs a soft delete (hides it from their view)
    notification.deletedByUser = true;
    await notification.save();
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification
};
