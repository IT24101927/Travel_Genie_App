const { body } = require('express-validator');

const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('travelStyle').optional().isString().withMessage('Travel style must be text'),
  body('currency').optional().isString().withMessage('Currency must be text'),
  body('preferred_weather').optional().isString().withMessage('Preferred weather must be text'),
  body('interests')
    .optional()
    .custom((value) => {
      if (Array.isArray(value) || typeof value === 'string') {
        return true;
      }
      throw new Error('Interests must be an array or comma separated string');
    })
];

module.exports = {
  updateProfileValidation
};
