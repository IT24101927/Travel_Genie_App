const User = require('./user.model');
const AppError = require('../../utils/appError');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.toSafeObject();
};

const updateProfile = async (userId, payload) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (payload.email && payload.email !== user.email) {
    const emailInUse = await User.findOne({ email: payload.email, _id: { $ne: userId } });
    if (emailInUse) {
      throw new AppError('Email already in use', 409);
    }
  }

  Object.assign(user, payload);
  await user.save();

  return user.toSafeObject();
};

module.exports = {
  getProfile,
  updateProfile
};
