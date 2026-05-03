const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUserById,
  resetUserPassword,
  deleteUserById,
  getResourceList
} = require('./admin.service');

const login = asyncHandler(async (req, res) => {
  const result = await adminLogin(req.body);
  return sendSuccess(res, 200, 'Admin login successful', result);
});

const stats = asyncHandler(async (req, res) => {
  const result = await getDashboardStats();
  return sendSuccess(res, 200, 'Dashboard stats', result);
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsers();
  return sendSuccess(res, 200, 'All users', { users });
});

const addUser = asyncHandler(async (req, res) => {
  const result = await createUser(req.body);
  return sendSuccess(res, 201, 'User created', result);
});

const editUser = asyncHandler(async (req, res) => {
  const result = await updateUserById(req.params.id, req.body);
  return sendSuccess(res, 200, 'User updated', result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await resetUserPassword(req.params.id, req.body);
  return sendSuccess(res, 200, 'Password reset successfully', result);
});

const removeUser = asyncHandler(async (req, res) => {
  const result = await deleteUserById(req.params.id);
  return sendSuccess(res, 200, 'User deleted', result);
});

const listResource = asyncHandler(async (req, res) => {
  const items = await getResourceList(req.params.resource);
  return sendSuccess(res, 200, `${req.params.resource} list`, { items });
});

module.exports = {
  login,
  stats,
  listUsers,
  addUser,
  editUser,
  resetPassword,
  removeUser,
  listResource
};
