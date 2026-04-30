const { body } = require('express-validator');

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const requireDistrict = (value, { req }) => {
  if (!hasValue(req.body.district) && !hasValue(req.body.district_id)) {
    throw new Error('District is required');
  }
  return true;
};

const requirePlaceType = (value, { req }) => {
  if (!hasValue(req.body.category) && !hasValue(req.body.type)) {
    throw new Error('Category is required');
  }
  return true;
};

const placeValidation = [
  body('name').trim().notEmpty().withMessage('Place name is required'),
  body().custom(requireDistrict),
  body().custom(requirePlaceType),
  body('district').optional().trim(),
  body('district_id').optional().isInt().withMessage('district_id must be a number'),
  body('category').optional().trim(),
  body('type').optional().trim(),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('estimatedCost must be >= 0'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

const updatePlaceValidation = [
  body('name').optional().trim().notEmpty().withMessage('Place name cannot be empty'),
  body('district').optional().trim(),
  body('district_id').optional().isInt().withMessage('district_id must be a number'),
  body('category').optional().trim(),
  body('type').optional().trim(),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('estimatedCost must be >= 0'),
  body('tags').optional().isArray().withMessage('tags must be an array')
];

module.exports = {
  placeValidation,
  updatePlaceValidation
};
