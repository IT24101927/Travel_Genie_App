const { body } = require('express-validator');

// Custom Validation Functions matching the Frontend

const validateName = (value) => {
  if (!value || !value.trim()) throw new Error('Name is required');
  const trimmed = value.trim();
  if (trimmed.length < 2) throw new Error('Name must be at least 2 characters');
  if (trimmed.length > 100) throw new Error('Name must be less than 100 characters');
  if (/[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.\-']/.test(trimmed)) {
    throw new Error('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
  }
  return true;
};

const validatePassword = (value) => {
  if (!value) throw new Error('Password is required');
  const missing = [];
  if (value.length < 8) missing.push('8+ characters');
  if (!/[A-Z]/.test(value)) missing.push('uppercase letter');
  if (!/[a-z]/.test(value)) missing.push('lowercase letter');
  if (!/\d/.test(value)) missing.push('number');
  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(value)) missing.push('special character');

  if (missing.length > 0) {
    throw new Error(`Password needs: ${missing.join(', ')}.`);
  }
  return true;
};

// Assuming frontend sends these for mobile registration alongside name, email, etc.
const validatePhoneOptional = (value) => {
  if (!value) return true; // Optional on backend model
  if (!/^0\d{9}$/.test(value)) {
    throw new Error('Phone number must be exactly 10 digits and start with 0');
  }
  return true;
};

const validateNicOptional = (value) => {
  if (!value) return true;
  const trimmed = String(value).trim();
  if (!/^\d{12}$/.test(trimmed) && !/^\d{9}[VvXx]$/.test(trimmed)) {
    throw new Error('NIC must be either 12 digits or 9 digits followed by V/X');
  }
  return true;
};

const validateDobOptional = (value) => {
  if (!value) return true;
  const trimmed = String(value).trim();

  // Support mm/dd/yyyy format from the mobile date picker
  const dateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!dateMatch) {
    throw new Error('Date of Birth must be in mm/dd/yyyy format');
  }

  const month = parseInt(dateMatch[1], 10);
  const day = parseInt(dateMatch[2], 10);
  const year = parseInt(dateMatch[3], 10);

  if (month < 1 || month > 12) throw new Error('Date of Birth has an invalid month');
  if (day < 1 || day > 31) throw new Error('Date of Birth has an invalid day');

  const parsed = new Date(year, month - 1, day);
  if (isNaN(parsed.getTime())) {
    throw new Error('Date of Birth is not a valid date');
  }

  const now = new Date();
  if (parsed > now) {
    throw new Error('Date of Birth cannot be in the future');
  }

  const ageDiff = now.getFullYear() - parsed.getFullYear();
  const ageAdjust = (now.getMonth() < parsed.getMonth() || (now.getMonth() === parsed.getMonth() && now.getDate() < parsed.getDate())) ? 1 : 0;
  const age = ageDiff - ageAdjust;

  if (age < 16) throw new Error('You must be at least 16 years old to register');
  if (age > 120) throw new Error('Date of Birth appears invalid (age over 120)');

  return true;
};

const validateEmailCustom = (value) => {
  if (!value || !String(value).trim()) throw new Error('Email is required');
  const trimmed = String(value).trim();
  if (!trimmed.includes('@') || trimmed.endsWith('@')) {
    throw new Error('Email must include @ followed by a domain (e.g. name@example.com)');
  }
  const afterAt = trimmed.split('@').slice(1).join('@');
  if (!afterAt || !afterAt.includes('.') || afterAt.startsWith('.') || afterAt.endsWith('.')) {
    throw new Error('Email domain must include a suffix like .com or .org (e.g. name@example.com)');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Please enter a valid email address (e.g. name@example.com)');
  }
  return true;
};

const sendRegisterCodeValidation = [
  body('email').custom(validateEmailCustom)
];

const verifyRegisterCodeValidation = [
  body('email').custom(validateEmailCustom),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('Verification code must be numeric')
];

const registerValidation = [
  body('fullName').custom(validateName),
  body('email').custom(validateEmailCustom),
  body('verificationToken').trim().notEmpty().withMessage('Verification token is required'),
  body('phone').optional().custom(validatePhoneOptional),
  body('nic').optional().custom(validateNicOptional),
  body('dob').optional().custom(validateDobOptional),
  body('travelStyle').optional().isString().withMessage('Travel style must be text'),
  body('interests').optional().isArray().withMessage('Interests must be an array'),
  body('password').custom(validatePassword)
];

const loginValidation = [
  body('email').custom(validateEmailCustom),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordRequestValidation = [
  body('email').custom(validateEmailCustom)
];

const forgotPasswordVerifyCodeValidation = [
  body('email').custom(validateEmailCustom),
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('Reset code must be numeric')
];

const forgotPasswordResetValidation = [
  body('email').custom(validateEmailCustom),
  body('resetToken').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword').custom(validatePassword)
];

module.exports = {
  sendRegisterCodeValidation,
  verifyRegisterCodeValidation,
  registerValidation,
  loginValidation,
  forgotPasswordRequestValidation,
  forgotPasswordVerifyCodeValidation,
  forgotPasswordResetValidation
};
