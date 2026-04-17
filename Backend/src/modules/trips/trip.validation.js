const { body } = require('express-validator');

const createTripValidation = [
  body('title').trim().notEmpty().withMessage('Trip title is required'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('startDate').isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').isISO8601().withMessage('endDate must be a valid date'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('status')
    .optional()
    .isIn(['planned', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

const updateTripValidation = [
  body('title').optional().trim().notEmpty().withMessage('Trip title cannot be empty'),
  body('destination').optional().trim().notEmpty().withMessage('Destination cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('status')
    .optional()
    .isIn(['planned', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

module.exports = {
  createTripValidation,
  updateTripValidation
};
