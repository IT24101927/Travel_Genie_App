const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { createReview, getReviews, getReviewById, updateReview, deleteReview, voteReview, flagReview, respondToReview, updateReviewStatus } = require('../review.service');


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

const voteReviewHandler = asyncHandler(async (req, res) => {
  const { isHelpful } = req.body;
  const review = await voteReview(req.params.id, req.user.userId, isHelpful);
  return sendSuccess(res, 200, 'Vote recorded successfully', { review });
});

const flagReviewHandler = asyncHandler(async (req, res) => {
  const review = await flagReview(req.params.id);
  return sendSuccess(res, 200, 'Review flagged for moderation', { review });
});

const respondToReviewHandler = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const review = await respondToReview(req.params.id, comment);
  return sendSuccess(res, 200, 'Response added successfully', { review });
});

const updateReviewStatusHandler = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const review = await updateReviewStatus(req.params.id, status);
  return sendSuccess(res, 200, 'Review status updated successfully', { review });
});

module.exports = {
  createReviewHandler,
  getReviewsHandler,
  getReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
  voteReviewHandler,
  flagReviewHandler,
  respondToReviewHandler,
  updateReviewStatusHandler
};
