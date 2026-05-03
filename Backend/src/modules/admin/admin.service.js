const User = require('../users/user.model');
const AppError = require('../../utils/appError');
const { generateToken } = require('../../utils/jwt');

const loadOptionalModel = (requirePath) => {
  try {
    return require(requirePath);
  } catch (err) {
    return null;
  }
};

const Trip = loadOptionalModel('../trips/trip.model');
const Place = loadOptionalModel('../places/place.model');
const Hotel = loadOptionalModel('../hotels/hotel.model');
const Expense = loadOptionalModel('../expenses/expense.model');
const Review = loadOptionalModel('../reviews/review.model');
const Notification = loadOptionalModel('../notifications/notification.model');
const Transport = loadOptionalModel('../transport/models/Transport');

const safeCount = async (Model) => {
  if (!Model) return 0;
  try {
    return await Model.countDocuments();
  } catch (err) {
    return 0;
  }
};

const safeList = async (Model, { limit = 50 } = {}) => {
  if (!Model) return [];
  try {
    return await Model.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  } catch (err) {
    return [];
  }
};

const adminLogin = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.role !== 'admin') {
    throw new AppError('Access denied. Admin account required.', 403);
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

const getDashboardStats = async () => {
  const [users, admins, trips, places, hotels, expenses, reviews, notifications, transports] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'admin' }),
    safeCount(Trip),
    safeCount(Place),
    safeCount(Hotel),
    safeCount(Expense),
    safeCount(Review),
    safeCount(Notification),
    safeCount(Transport)
  ]);

  return {
    users,
    admins,
    trips,
    places,
    hotels,
    expenses,
    reviews,
    notifications,
    transports
  };
};

const getAllUsers = async () => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  return users.map((u) => {
    const { password, ...rest } = u;
    return rest;
  });
};

const VALID_TRAVEL_STYLES = ['Adventure', 'Relax', 'Culture', 'Luxury', 'Budget', 'Family', 'Backpacker'];
const VALID_WEATHER = ['Sunny', 'Mild', 'Rainy', 'Cold', 'Any'];
const VALID_CURRENCIES = ['LKR', 'USD', 'EUR'];

const createUser = async ({ fullName, email, password, phone, travelStyle, interests, currency, preferred_weather, role, isActive }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('Email is already registered', 409);
  }

  const user = await User.create({
    fullName: String(fullName || '').trim(),
    email: normalizedEmail,
    password: String(password || ''),
    phone: String(phone || '').trim(),
    travelStyle: VALID_TRAVEL_STYLES.includes(travelStyle) ? travelStyle : '',
    interests: Array.isArray(interests) ? interests : [],
    preferences: {
      currency: VALID_CURRENCIES.includes(currency) ? currency : 'LKR',
      preferred_weather: VALID_WEATHER.includes(preferred_weather) ? preferred_weather : 'Any'
    },
    role: ['user', 'admin'].includes(role) ? role : 'user',
    isActive: isActive !== false
  });

  return { user: user.toSafeObject() };
};

const updateUserById = async (userId, { fullName, phone, dob, nic, gender, travelStyle, interests, currency, preferred_weather, role, isActive }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const validGenders = ['MALE', 'FEMALE', 'OTHER', ''];
  if (fullName !== undefined) user.fullName = String(fullName).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (dob !== undefined) user.dob = String(dob).trim();
  if (nic !== undefined) user.nic = String(nic).trim();
  if (gender !== undefined) {
    const g = String(gender || '').toUpperCase();
    user.gender = validGenders.includes(g) ? g : '';
  }
  if (travelStyle !== undefined && VALID_TRAVEL_STYLES.includes(travelStyle)) user.travelStyle = travelStyle;
  if (Array.isArray(interests)) user.interests = interests;
  if (currency !== undefined && VALID_CURRENCIES.includes(currency)) user.preferences.currency = currency;
  if (preferred_weather !== undefined && VALID_WEATHER.includes(preferred_weather)) user.preferences.preferred_weather = preferred_weather;
  if (role !== undefined && ['user', 'admin'].includes(role)) user.role = role;
  if (isActive !== undefined) user.isActive = Boolean(isActive);

  await user.save();
  return { user: user.toSafeObject() };
};

const resetUserPassword = async (userId, { newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);
  if (!newPassword || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }
  user.password = newPassword;
  await user.save();
  return { reset: true };
};

const deleteUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (user.role === 'admin') {
    throw new AppError('Cannot delete an admin account', 400);
  }
  await user.deleteOne();
  return { deleted: true };
};

const getResourceList = async (resource) => {
  const map = {
    trips: Trip,
    places: Place,
    hotels: Hotel,
    expenses: Expense,
    reviews: Review,
    notifications: Notification,
    transports: Transport
  };

  const Model = map[resource];
  if (Model === undefined) {
    throw new AppError('Unknown resource', 400);
  }

  return safeList(Model, { limit: 100 });
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUserById,
  resetUserPassword,
  deleteUserById,
  getResourceList
};
