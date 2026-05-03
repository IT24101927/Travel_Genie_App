const { body } = require('express-validator');

const createReviewValidation = [
  body('targetType').isIn(['place', 'hotel']).withMessage('targetType must be place or hotel'),
  body('targetId').isMongoId().withMessage('targetId must be a valid id'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('comment must be a string')
];

const updateReviewValidation = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('comment must be a string')
];

module.exports = {
  createReviewValidation,
  updateReviewValidation
};
