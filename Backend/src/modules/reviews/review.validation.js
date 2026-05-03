const { body } = require('express-validator');

const createReviewValidation = [
  body('targetType').isIn(['place', 'hotel']).withMessage('targetType must be place or hotel'),
  body('targetId').isMongoId().withMessage('targetId must be a valid id'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('comment').isString().isLength({ min: 10 }).withMessage('comment must be at least 10 characters'),
  body('title').optional().isString().isLength({ max: 100 }).withMessage('title must be max 100 characters'),
  body('travelType').optional().isIn(['solo', 'couple', 'family', 'friends', 'business', '']).withMessage('Invalid travel type'),
  body('visitDate').optional().isISO8601().withMessage('Invalid visit date'),
  body('wouldRecommend').optional().isBoolean().withMessage('wouldRecommend must be a boolean'),
  body('pros').optional().isArray().withMessage('pros must be an array'),
  body('cons').optional().isArray().withMessage('cons must be an array')
];

const updateReviewValidation = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ min: 10 }).withMessage('comment must be at least 10 characters'),
  body('title').optional().isString().isLength({ max: 100 }).withMessage('title must be max 100 characters'),
  body('travelType').optional().isIn(['solo', 'couple', 'family', 'friends', 'business', '']).withMessage('Invalid travel type'),
  body('visitDate').optional().isISO8601().withMessage('Invalid visit date'),
  body('wouldRecommend').optional().isBoolean().withMessage('wouldRecommend must be a boolean'),
  body('pros').optional().isArray().withMessage('pros must be an array'),
  body('cons').optional().isArray().withMessage('cons must be an array')
];

module.exports = {
  createReviewValidation,
  updateReviewValidation
};
