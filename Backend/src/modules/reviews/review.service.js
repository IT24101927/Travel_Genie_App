const Review = require('./models/review.model');
const AppError = require('../../utils/appError');
const mongoose = require('mongoose');
const Place = require('../places/models/place.model');
const Hotel = require('../hotels/models/hotel.model');

const NotificationService = require('../notifications/notification.service');

const createReview = async (user, payload) => {
  const review = await Review.create({ ...payload, userId: user.userId });
  // Instant sync as per user preference
  await syncResourceRating(review.targetType, review.targetId);
  return review;
};

const getReviews = async (query) => {
  const filter = {};

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  if (query.targetId) {
    filter.targetId = query.targetId;
  }

  return Review.find(filter)
    .populate('userId', 'fullName profileImage')
    .sort({ createdAt: -1 });
};

const getReviewById = async (id) => {
  const review = await Review.findById(id).populate('userId', 'fullName profileImage');
  if (!review) {
    throw new AppError('Review not found', 404);
  }
  return review;
};

const updateReview = async (id, user, payload) => {
  const review = await getReviewById(id);

  if (user.role !== 'admin' && review.userId._id.toString() !== user.userId) {
    throw new AppError('You cannot edit this review', 403);
  }

  Object.assign(review, payload);
  await review.save();
  // Sync in case rating changed
  await syncResourceRating(review.targetType, review.targetId);
  return review;
};

const syncResourceRating = async (targetType, targetId) => {
  const Model = targetType === 'hotel' ? Hotel : Place;
  
  const stats = await Review.aggregate([
    { $match: { targetType, targetId: new mongoose.Types.ObjectId(targetId), status: 'approved' } },
    {
      $group: {
        _id: '$targetId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Model.findByIdAndUpdate(targetId, {
      rating: stats[0].avgRating,
      review_count: stats[0].reviewCount
    });
  } else {
    await Model.findByIdAndUpdate(targetId, {
      rating: 0,
      review_count: 0
    });
  }
};

const deleteReview = async (id, user) => {
  const review = await getReviewById(id);

  if (user.role !== 'admin' && review.userId._id.toString() !== user.userId) {
    throw new AppError('You cannot delete this review', 403);
  }

  const { targetType, targetId } = review;
  await review.deleteOne();
  await syncResourceRating(targetType, targetId);
};

const voteReview = async (id, userId, isHelpful) => {
  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found', 404);

  if (review.helpfulBy.includes(userId)) {
    throw new AppError('You have already voted on this review', 400);
  }

  if (isHelpful) {
    review.helpfulCount += 1;
  } else {
    review.notHelpfulCount += 1;
  }
  review.helpfulBy.push(userId);
  await review.save();
  return review;
};

const flagReview = async (id) => {
  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found', 404);

  review.reportCount += 1;
  review.isReported = true;
  // If reports reach a threshold, we might auto-pend it
  if (review.reportCount >= 3) {
    review.status = 'flagged';
    
    // Alert admins (admins see all notifications, but we assign it to the author for context)
    await NotificationService.createNotification({
      userId: review.userId,
      type: 'REVIEW_FLAGGED',
      message: `A review for ${review.targetType} "${review.targetId}" has been auto-flagged due to multiple reports.`,
      relatedId: review._id
    });
    
    // Specifically notify the user with a softer message
    await NotificationService.createNotification({
      userId: review.userId,
      type: 'REVIEW_REJECTED',
      message: `Your review for ${review.targetType} "${review.targetId}" has been hidden as it is currently under review by our moderation team.`,
      relatedId: review._id
    });
  }
  
  await review.save();
  // Sync in case it was auto-flagged (it will remove from approved average)
  await syncResourceRating(review.targetType, review.targetId);
  return review;
};

const respondToReview = async (id, adminResponse) => {
  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found', 404);

  review.adminResponse = adminResponse;
  await review.save();
  return review;
};

const updateReviewStatus = async (id, status) => {
  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found', 404);

  review.status = status;
  // If admin approves it, clear the report flags
  if (status === 'approved') {
    review.isReported = false;
    review.reportCount = 0;
  }
  
  await review.save();
  await syncResourceRating(review.targetType, review.targetId);

  // Notify the author of the outcome
  const notificationType = status === 'approved' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED';
  const outcomeLabel = status === 'approved' ? 'approved' : 'rejected';
  
  await NotificationService.createNotification({
    userId: review.userId,
    type: notificationType,
    message: `Your review for ${review.targetType} "${review.targetId}" has been ${outcomeLabel} by an admin.`,
    relatedId: review._id
  });

  return review;
};

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  voteReview,
  flagReview,
  respondToReview,
  updateReviewStatus
};
