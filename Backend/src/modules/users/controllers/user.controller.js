const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const { getProfile, updateProfile, changePassword, deleteAccount } = require('../user.service');


const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user.userId);
  return sendSuccess(res, 200, 'Profile fetched successfully', { user });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const payload = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    dob: req.body.dob,
    nic: req.body.nic,
    gender: req.body.gender,
    travelStyle: req.body.travelStyle,
    interests: req.body.interests,
    currency: req.body.currency,
    preferred_weather: req.body.preferred_weather
  };

  if (req.file) {
    payload.profileImage = req.file.path.startsWith('http') 
      ? req.file.path 
      : `/uploads/profiles/${req.file.filename}`;
  }

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const user = await updateProfile(req.user.userId, payload);
  return sendSuccess(res, 200, 'Profile updated successfully', { user });
});

const changeMyPassword = asyncHandler(async (req, res) => {
  await changePassword(req.user.userId, req.body);
  return sendSuccess(res, 200, 'Password changed successfully', {});
});

const deleteMyAccount = asyncHandler(async (req, res) => {
  await deleteAccount(req.user.userId, req.body);
  return sendSuccess(res, 200, 'Account deleted successfully', {});
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  deleteMyAccount
};
