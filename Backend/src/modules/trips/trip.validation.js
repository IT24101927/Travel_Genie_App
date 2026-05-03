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
    .withMessage('Invalid status'),
  body('districtId').optional().isInt({ min: 1 }).withMessage('districtId must be a positive integer'),
  body('districtName').optional().trim().isString(),
  body('province').optional().trim().isString(),
  body('selectedPlaces').optional().isArray().withMessage('selectedPlaces must be an array'),
  body('selectedHotel')
    .optional({ nullable: true })
    .custom((value) => value === null || (typeof value === 'object' && !Array.isArray(value)))
    .withMessage('selectedHotel must be an object'),
  body('tripType').optional().isIn(['solo', 'couple', 'family', 'group']).withMessage('Invalid tripType'),
  body('travelers').optional().isInt({ min: 1, max: 50 }).withMessage('travelers must be between 1 and 50'),
  body('nights').optional().isInt({ min: 1, max: 365 }).withMessage('nights must be between 1 and 365'),
  body('hotelType').optional().trim().isString(),
  body('currency').optional().trim().isString(),
  body('budgetBreakdown').optional().isObject().withMessage('budgetBreakdown must be an object')
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
    .withMessage('Invalid status'),
  body('districtId').optional().isInt({ min: 1 }).withMessage('districtId must be a positive integer'),
  body('districtName').optional().trim().isString(),
  body('province').optional().trim().isString(),
  body('selectedPlaces').optional().isArray().withMessage('selectedPlaces must be an array'),
  body('selectedHotel')
    .optional({ nullable: true })
    .custom((value) => value === null || (typeof value === 'object' && !Array.isArray(value)))
    .withMessage('selectedHotel must be an object'),
  body('tripType').optional().isIn(['solo', 'couple', 'family', 'group']).withMessage('Invalid tripType'),
  body('travelers').optional().isInt({ min: 1, max: 50 }).withMessage('travelers must be between 1 and 50'),
  body('nights').optional().isInt({ min: 1, max: 365 }).withMessage('nights must be between 1 and 365'),
  body('hotelType').optional().trim().isString(),
  body('currency').optional().trim().isString(),
  body('budgetBreakdown').optional().isObject().withMessage('budgetBreakdown must be an object')
];

module.exports = {
  createTripValidation,
  updateTripValidation
};
