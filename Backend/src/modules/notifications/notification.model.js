const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: false
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['reminder', 'system', 'trip', 'expense', 'other', 'BUDGET_100', 'BUDGET_80', 'PRICE_UPDATE', 'REVIEW_FLAGGED', 'REVIEW_APPROVED', 'REVIEW_REJECTED'],
      default: 'system'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    deletedByUser: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
