const { body } = require('express-validator');

const hotelValidation = [
  body('name').trim().notEmpty().withMessage('Hotel name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('priceRange').isFloat({ min: 0 }).withMessage('priceRange must be >= 0'),
  body('rating').isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  body('amenities').optional().isArray().withMessage('amenities must be an array')
];

const updateHotelValidation = [
  body('name').optional().trim().notEmpty().withMessage('Hotel name cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('priceRange').optional().isFloat({ min: 0 }).withMessage('priceRange must be >= 0'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  body('amenities').optional().isArray().withMessage('amenities must be an array')
];

module.exports = {
  hotelValidation,
  updateHotelValidation
};
