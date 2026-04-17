const { body } = require('express-validator');

const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Valid email is required')
];

module.exports = {
  updateProfileValidation
};
