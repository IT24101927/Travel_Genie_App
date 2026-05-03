const { body } = require('express-validator');

const createNotificationValidation = [
  body('userId').isMongoId().withMessage('Valid userId is required'),
  body('tripId').optional().isMongoId().withMessage('Valid tripId is required'),
  body('title').optional().trim(),
  body('message').trim().notEmpty().withMessage('message is required'),
  body('type')
    .optional()
    .isIn(['reminder', 'system', 'trip', 'expense', 'other', 'BUDGET_100', 'BUDGET_80'])
    .withMessage('Invalid notification type')
];

module.exports = {
  createNotificationValidation
};
