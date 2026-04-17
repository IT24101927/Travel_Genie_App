const express = require('express');

const validateRequest = require('../../middleware/validateMiddleware');
const { protect } = require('../../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('./auth.validation');
const { register, login, getMe } = require('./auth.controller');

const router = express.Router();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/me', protect, getMe);

module.exports = router;
