const { body } = require('express-validator');

const createExpenseValidation = [
  body('tripId').isMongoId().withMessage('Valid tripId is required'),
  body('title').notEmpty().withMessage('Description/Title is required'),
  body('category')
    .isIn(['transport', 'food', 'hotel', 'activity', 'shopping', 'other'])
    .withMessage('Invalid expense category'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isIn(['LKR', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('date').isISO8601().withMessage('Valid expense date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'wallet', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),
  body('status').optional().isIn(['planned', 'paid']).withMessage('Invalid status'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

const updateExpenseValidation = [
  body('tripId').optional().isMongoId().withMessage('tripId must be valid'),
  body('title').optional().notEmpty().withMessage('Description/Title cannot be empty'),
  body('category')
    .optional()
    .isIn(['transport', 'food', 'hotel', 'activity', 'shopping', 'other'])
    .withMessage('Invalid expense category'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isIn(['LKR', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('date').optional().isISO8601().withMessage('Valid expense date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'wallet', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),
  body('status').optional().isIn(['planned', 'paid']).withMessage('Invalid status'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

module.exports = {
  createExpenseValidation,
  updateExpenseValidation
};
