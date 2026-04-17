const { body } = require('express-validator');

const createNotificationValidation = [
  body('userId').isMongoId().withMessage('Valid userId is required'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('message').trim().notEmpty().withMessage('message is required'),
  body('type')
    .optional()
    .isIn(['reminder', 'system', 'trip', 'expense', 'other'])
    .withMessage('Invalid notification type')
];

module.exports = {
  createNotificationValidation
};
