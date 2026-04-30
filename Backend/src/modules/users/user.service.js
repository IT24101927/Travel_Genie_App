const User = require('./user.model');
const AppError = require('../../utils/appError');

const normalizeTravelStyle = (value = '') => {
  const input = String(value || '').trim();
  if (!input) return '';
  const lowered = input.toLowerCase();
  const map = {
    adventure: 'Adventure',
    relax: 'Relax',
    culture: 'Culture',
    luxury: 'Luxury',
    budget: 'Budget',
    family: 'Family',
    backpacker: 'Backpacker'
  };
  return map[lowered] || input;
};

const normalizeCurrency = (value = 'LKR') => {
  const source = String(value || 'LKR').trim();
  const shortCode = source.split(' ')[0].replace(/[^A-Za-z]/g, '').toUpperCase();
  return shortCode || 'LKR';
};

const normalizeWeather = (value = 'Any') => {
  const input = String(value || 'Any').trim();
  if (!input) return 'Any';
  const lowered = input.toLowerCase();
  const map = {
    any: 'Any',
    sunny: 'Sunny',
    mild: 'Mild',
    rainy: 'Rainy',
    cold: 'Cold'
  };
  return map[lowered] || input;
};

const parseInterests = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return [...new Set(parsed.map((item) => String(item || '').trim()).filter(Boolean))];
        }
      } catch (error) {
        // Fallback to comma separated parsing if JSON parsing fails.
      }
    }

    return [...new Set(trimmed.split(',').map((item) => item.trim()).filter(Boolean))];
  }

  return undefined;
};

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

  const validGenders = ['MALE', 'FEMALE', 'OTHER', ''];
  if (payload.gender !== undefined) {
    const g = String(payload.gender || '').toUpperCase();
    payload.gender = validGenders.includes(g) ? g : '';
  }

  if (payload.travelStyle !== undefined) {
    payload.travelStyle = normalizeTravelStyle(payload.travelStyle);
  }

  if (payload.interests !== undefined) {
    payload.interests = parseInterests(payload.interests);
  }

  const hasCurrency = payload.currency !== undefined;
  const hasWeather = payload.preferred_weather !== undefined;
  if (hasCurrency || hasWeather) {
    payload.preferences = {
      ...(user.preferences || {}),
      currency: hasCurrency
        ? normalizeCurrency(payload.currency)
        : (user.preferences?.currency || 'LKR'),
      preferred_weather: hasWeather
        ? normalizeWeather(payload.preferred_weather)
        : (user.preferences?.preferred_weather || 'Any')
    };
  }

  delete payload.currency;
  delete payload.preferred_weather;

  Object.assign(user, payload);
  await user.save();

  return user.toSafeObject();
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new AppError('Current password is incorrect', 401);

  const missing = [];
  if (!newPassword || newPassword.length < 8) missing.push('8+ characters');
  if (!/[A-Z]/.test(newPassword || '')) missing.push('uppercase letter');
  if (!/[a-z]/.test(newPassword || '')) missing.push('lowercase letter');
  if (!/\d/.test(newPassword || '')) missing.push('number');
  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(newPassword || '')) missing.push('special character');
  if (missing.length > 0) {
    throw new AppError(`New password needs: ${missing.join(', ')}.`, 400);
  }

  user.password = newPassword;
  await user.save();
};

const deleteAccount = async (userId, { password }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isValid = await user.comparePassword(password);
  if (!isValid) throw new AppError('Incorrect password', 401);

  await user.deleteOne();
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
};
