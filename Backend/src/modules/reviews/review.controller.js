const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const { createReview, getReviews, getReviewById, updateReview, deleteReview } = require('./review.service');

const createReviewHandler = asyncHandler(async (req, res) => {
  const review = await createReview(req.user, req.body);
  return sendSuccess(res, 201, 'Review created successfully', { review });
});

const getReviewsHandler = asyncHandler(async (req, res) => {
  const reviews = await getReviews(req.query);
  return sendSuccess(res, 200, 'Reviews fetched successfully', { reviews });
});

const getReviewHandler = asyncHandler(async (req, res) => {
  const review = await getReviewById(req.params.id);
  return sendSuccess(res, 200, 'Review fetched successfully', { review });
});

const updateReviewHandler = asyncHandler(async (req, res) => {
  const review = await updateReview(req.params.id, req.user, req.body);
  return sendSuccess(res, 200, 'Review updated successfully', { review });
});

const deleteReviewHandler = asyncHandler(async (req, res) => {
  await deleteReview(req.params.id, req.user);
  return sendSuccess(res, 200, 'Review deleted successfully');
});

module.exports = {
  createReviewHandler,
  getReviewsHandler,
  getReviewHandler,
  updateReviewHandler,
  deleteReviewHandler
};
