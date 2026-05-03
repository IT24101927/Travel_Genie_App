const { body } = require('express-validator');

const hotelValidation = [
  body('name').trim().notEmpty().withMessage('Hotel name is required'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('address_text').optional().trim(),
  body('price_per_night').optional().isFloat({ min: 0 }).withMessage('price_per_night must be >= 0'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  body('star_class').optional().isFloat({ min: 0, max: 5 }),
  body('hotel_type').optional().trim(),
  body('district_id').optional().isInt({ min: 1 }).withMessage('district_id must be a positive integer'),
  body('nearby_place_id').optional().isInt({ min: 1 }).withMessage('nearby_place_id must be a positive integer'),
  body('place_id').optional().isInt({ min: 1 }).withMessage('place_id must be a positive integer'),
  body('district').optional().trim(),
  body('amenities').optional().isArray().withMessage('amenities must be an array'),
  body('contact').optional().isObject().withMessage('contact must be an object'),
  body('image_url').optional().trim(),
  body('lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
  body('lng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false')
];

const updateHotelValidation = [
  body('name').optional().trim().notEmpty().withMessage('Hotel name cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('address_text').optional().trim(),
  body('price_per_night').optional().isFloat({ min: 0 }).withMessage('price_per_night must be >= 0'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  body('star_class').optional().isFloat({ min: 0, max: 5 }),
  body('hotel_type').optional().trim(),
  body('district_id').optional().isInt({ min: 1 }).withMessage('district_id must be a positive integer'),
  body('nearby_place_id').optional().isInt({ min: 1 }).withMessage('nearby_place_id must be a positive integer'),
  body('place_id').optional().isInt({ min: 1 }).withMessage('place_id must be a positive integer'),
  body('district').optional().trim(),
  body('amenities').optional().isArray().withMessage('amenities must be an array'),
  body('contact').optional().isObject().withMessage('contact must be an object'),
  body('image_url').optional().trim(),
  body('lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
  body('lng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false')
];

module.exports = {
  hotelValidation,
  updateHotelValidation
};
