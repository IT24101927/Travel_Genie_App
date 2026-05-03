const Review = require('./review.model');
const AppError = require('../../utils/appError');

const createReview = async (user, payload) => {
  return Review.create({ ...payload, userId: user.userId });
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
  return review;
};

const deleteReview = async (id, user) => {
  const review = await getReviewById(id);

  if (user.role !== 'admin' && review.userId._id.toString() !== user.userId) {
    throw new AppError('You cannot delete this review', 403);
  }

  await review.deleteOne();
};

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview
};
