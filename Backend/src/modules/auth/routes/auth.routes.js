const express = require('express');

const validateRequest = require('../../../middleware/validateMiddleware');
const { protect } = require('../../../middleware/authMiddleware');
const {
	sendRegisterCodeValidation,
	verifyRegisterCodeValidation,
	registerValidation,
	loginValidation,
	forgotPasswordRequestValidation,
	forgotPasswordVerifyCodeValidation,
	forgotPasswordResetValidation
} = require('../auth.validation');
const {
	sendRegisterCode,
	verifyRegisterCode,
	register,
	login,
	getMe,
	forgotPasswordRequest,
	forgotPasswordVerifyCode,
	forgotPasswordReset
} = require('../controllers/auth.controller');


const router = express.Router();

router.post('/register/send-code', sendRegisterCodeValidation, validateRequest, sendRegisterCode);
router.post('/register/verify-code', verifyRegisterCodeValidation, validateRequest, verifyRegisterCode);
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/password-reset/request', forgotPasswordRequestValidation, validateRequest, forgotPasswordRequest);
router.post('/password-reset/verify-code', forgotPasswordVerifyCodeValidation, validateRequest, forgotPasswordVerifyCode);
router.post('/password-reset/reset', forgotPasswordResetValidation, validateRequest, forgotPasswordReset);
router.get('/me', protect, getMe);

module.exports = router;
