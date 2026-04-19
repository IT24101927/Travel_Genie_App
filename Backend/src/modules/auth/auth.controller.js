const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const {
  sendRegistrationCode,
  verifyRegistrationCode,
  registerUser,
  loginUser,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword
} = require('./auth.service');

const sendRegisterCode = asyncHandler(async (req, res) => {
  const result = await sendRegistrationCode(req.body);
  return sendSuccess(res, 200, 'Verification code sent', result);
});

const verifyRegisterCode = asyncHandler(async (req, res) => {
  const result = await verifyRegistrationCode(req.body);
  return sendSuccess(res, 200, 'Email verified successfully', result);
});

const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  return sendSuccess(res, 201, 'User registered successfully', result);
});

const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  return sendSuccess(res, 200, 'Login successful', result);
});

const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Authenticated user', { user: req.user });
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.body);
  return sendSuccess(res, 200, 'If that email exists, a reset code has been sent.', result);
});

const forgotPasswordVerifyCode = asyncHandler(async (req, res) => {
  const result = await verifyPasswordResetCode(req.body);
  return sendSuccess(res, 200, 'Reset code verified successfully.', result);
});

const forgotPasswordReset = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  return sendSuccess(res, 200, 'Password reset successful. Please sign in with your new password.', result);
});

module.exports = {
  sendRegisterCode,
  verifyRegisterCode,
  register,
  login,
  getMe,
  forgotPasswordRequest,
  forgotPasswordVerifyCode,
  forgotPasswordReset
};
