const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const { getProfile, updateProfile } = require('./user.service');

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user.userId);
  return sendSuccess(res, 200, 'Profile fetched successfully', { user });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const payload = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone
  };

  if (req.file) {
    payload.profileImage = `/uploads/profiles/${req.file.filename}`;
  }

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const user = await updateProfile(req.user.userId, payload);
  return sendSuccess(res, 200, 'Profile updated successfully', { user });
});

module.exports = {
  getMyProfile,
  updateMyProfile
};
