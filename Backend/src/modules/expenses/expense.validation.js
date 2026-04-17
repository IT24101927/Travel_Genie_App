const { body } = require('express-validator');

const createExpenseValidation = [
  body('tripId').isMongoId().withMessage('Valid tripId is required'),
  body('category')
    .isIn(['transport', 'food', 'hotel', 'activity', 'shopping', 'other'])
    .withMessage('Invalid expense category'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').isISO8601().withMessage('Valid expense date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'wallet', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

const updateExpenseValidation = [
  body('tripId').optional().isMongoId().withMessage('tripId must be valid'),
  body('category')
    .optional()
    .isIn(['transport', 'food', 'hotel', 'activity', 'shopping', 'other'])
    .withMessage('Invalid expense category'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').optional().isISO8601().withMessage('Valid expense date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'wallet', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

module.exports = {
  createExpenseValidation,
  updateExpenseValidation
};
