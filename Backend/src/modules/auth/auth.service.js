const User = require('../users/user.model');
const AppError = require('../../utils/appError');
const { generateToken } = require('../../utils/jwt');

const registerUser = async ({ fullName, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: 'user'
  });

  const token = generateToken({ userId: user._id, role: user.role });

  return {
    user: user.toSafeObject(),
    token
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({ userId: user._id, role: user.role });

  return {
    user: user.toSafeObject(),
    token
  };
};

module.exports = {
  registerUser,
  loginUser
};
