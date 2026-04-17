const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const { registerUser, loginUser } = require('./auth.service');

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

module.exports = {
  register,
  login,
  getMe
};
