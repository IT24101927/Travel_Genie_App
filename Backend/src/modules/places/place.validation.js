const { body } = require('express-validator');

const placeValidation = [
  body('name').trim().notEmpty().withMessage('Place name is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('estimatedCost must be >= 0'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

const updatePlaceValidation = [
  body('name').optional().trim().notEmpty().withMessage('Place name cannot be empty'),
  body('district').optional().trim().notEmpty().withMessage('District cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('estimatedCost must be >= 0'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

module.exports = {
  placeValidation,
  updatePlaceValidation
};
