const express = require('express');

const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const validateRequest = require('../../middleware/validateMiddleware');
const { createReviewValidation, updateReviewValidation } = require('./review.validation');
const {
  createReviewHandler,
  getReviewsHandler,
  getReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
  voteReviewHandler,
  flagReviewHandler,
  respondToReviewHandler,
  updateReviewStatusHandler
} = require('./review.controller');

const router = express.Router();

router.get('/admin/all', protect, authorize('admin'), getReviewsHandler);
router.get('/', getReviewsHandler);
router.get('/:id', getReviewHandler);

router.post('/', protect, createReviewValidation, validateRequest, createReviewHandler);
router.put('/:id', protect, updateReviewValidation, validateRequest, updateReviewHandler);
router.delete('/:id', protect, deleteReviewHandler);
router.post('/:id/helpful', protect, voteReviewHandler);
router.post('/:id/flag', protect, flagReviewHandler);

// Admin specialized actions
router.put('/:id/status', protect, authorize('admin'), updateReviewStatusHandler);
router.post('/:id/response', protect, authorize('admin'), respondToReviewHandler);

module.exports = router;
