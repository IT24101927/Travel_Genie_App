const User = require('../users/user.model');
const env = require('../../config/env');
const AppError = require('../../utils/appError');
const { generateToken } = require('../../utils/jwt');
const { sendMail } = require('../../utils/mailer');
const { issueCode, verifyCode, consumeVerificationToken } = require('./emailVerification.store');
const { issueResetCode, verifyResetCode, consumeResetToken } = require('./passwordReset.store');

const PASSWORD_RESET_COOLDOWN_SECONDS = 60;
const passwordResetCooldownStore = new Map();

const logVerificationCode = ({ label, email, code, expiresInMinutes, mailResult }) => {
  if (env.nodeEnv === 'production' && mailResult.sent) {
    return;
  }

  console.log('========================================');
  console.log(`[${label}] Verification code for: ${email}`);
  console.log(`[${label}] CODE: ${code}`);
  console.log(`[${label}] Expires in ${expiresInMinutes} minutes`);

  if (!mailResult.sent && mailResult.reason) {
    console.log(`[${label}] Email not sent: ${mailResult.reason}`);
  }

  console.log('========================================');
};

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

const sendRegistrationCode = async ({ email }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const expiresInMinutes = 15;
  const { code } = issueCode({ email: normalizedEmail, expiresInMinutes });

  const subject = 'TravelGenie Verification Code';
  const text = `Your TravelGenie verification code is ${code}. It expires in ${expiresInMinutes} minutes.`;
  const html = `<p>Your TravelGenie verification code is <strong>${code}</strong>.</p><p>This code expires in ${expiresInMinutes} minutes.</p>`;

  const mailResult = await sendMail({
    to: normalizedEmail,
    subject,
    text,
    html
  });

  logVerificationCode({
    label: 'SignupVerify',
    email: normalizedEmail,
    code,
    expiresInMinutes,
    mailResult
  });

  return {
    email: normalizedEmail,
    expiresInSeconds: expiresInMinutes * 60,
    emailSent: mailResult.sent
  };
};

const verifyRegistrationCode = async ({ email, code }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const result = verifyCode({ email: normalizedEmail, code });

  if (!result.ok) {
    if (result.reason === 'EXPIRED') {
      throw new AppError('Verification code has expired. Please request a new code.', 400);
    }

    if (result.reason === 'TOO_MANY_ATTEMPTS') {
      throw new AppError('Too many invalid attempts. Please request a new code.', 429);
    }

    if (result.reason === 'NO_CODE') {
      throw new AppError('No verification code found. Please request a code first.', 400);
    }

    throw new AppError('Invalid verification code.', 400);
  }

  return {
    email: normalizedEmail,
    verificationToken: result.verificationToken
  };
};

const registerUser = async ({
  fullName,
  email,
  password,
  verificationToken,
  travelStyle,
  interests,
  currency,
  preferred_weather,
  preferences,
  phone,
  dob,
  nic,
  gender
}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const isVerified = consumeVerificationToken({
    email: normalizedEmail,
    verificationToken
  });

  if (!isVerified) {
    throw new AppError('Email is not verified. Please complete email verification first.', 400);
  }

  const resolvedTravelStyle = normalizeTravelStyle(travelStyle || preferences?.style);
  const resolvedInterests = Array.isArray(interests)
    ? interests
    : Array.isArray(preferences?.interests)
      ? preferences.interests
      : [];
  const resolvedCurrency = normalizeCurrency(currency || preferences?.currency || 'LKR');
  const resolvedPreferredWeather = normalizeWeather(
    preferred_weather || preferences?.preferred_weather || preferences?.weather || 'Any'
  );

  const validGenders = ['MALE', 'FEMALE', 'OTHER'];
  const resolvedGender = validGenders.includes(String(gender || '').toUpperCase())
    ? String(gender).toUpperCase()
    : '';

  const user = await User.create({
    fullName,
    email: normalizedEmail,
    password,
    phone: String(phone || '').trim(),
    dob: String(dob || '').trim(),
    nic: String(nic || '').trim(),
    gender: resolvedGender,
    travelStyle: resolvedTravelStyle,
    interests: resolvedInterests,
    preferences: {
      currency: resolvedCurrency,
      preferred_weather: resolvedPreferredWeather
    },
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

  if (user.isActive === false) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
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

const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const now = Date.now();
  const lastRequestedAt = passwordResetCooldownStore.get(normalizedEmail) || 0;
  const elapsedSeconds = Math.floor((now - lastRequestedAt) / 1000);

  if (lastRequestedAt && elapsedSeconds < PASSWORD_RESET_COOLDOWN_SECONDS) {
    const remainingSeconds = PASSWORD_RESET_COOLDOWN_SECONDS - elapsedSeconds;
    throw new AppError(`Please wait ${remainingSeconds}s before requesting another reset code.`, 429);
  }

  passwordResetCooldownStore.set(normalizedEmail, now);

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return {
      email: normalizedEmail,
      expiresInSeconds: 15 * 60,
      emailSent: false
    };
  }

  const expiresInMinutes = 15;
  const { code: resetCode } = issueResetCode({ email: normalizedEmail, expiresInMinutes });

  const subject = 'TravelGenie Password Reset Request';
  const text = `We received a password reset request for your account. Your code is ${resetCode}. It expires in 15 minutes.`;
  const html = `<p>We received a password reset request for your account.</p><p>Your code is <strong>${resetCode}</strong>.</p><p>This code expires in ${expiresInMinutes} minutes.</p>`;

  const mailResult = await sendMail({
    to: normalizedEmail,
    subject,
    text,
    html
  });

  logVerificationCode({
    label: 'ResetPassword',
    email: normalizedEmail,
    code: resetCode,
    expiresInMinutes,
    mailResult
  });

  return {
    email: normalizedEmail,
    expiresInSeconds: expiresInMinutes * 60,
    emailSent: mailResult.sent
  };
};

const verifyPasswordResetCode = async ({ email, code }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const result = verifyResetCode({ email: normalizedEmail, code });

  if (!result.ok) {
    if (result.reason === 'EXPIRED') {
      throw new AppError('Reset code has expired. Please request a new code.', 400);
    }

    if (result.reason === 'TOO_MANY_ATTEMPTS') {
      throw new AppError('Too many invalid attempts. Please request a new code.', 429);
    }

    if (result.reason === 'NO_CODE') {
      throw new AppError('No reset code found. Please request a code first.', 400);
    }

    throw new AppError('Invalid reset code.', 400);
  }

  return {
    email: normalizedEmail,
    resetToken: result.resetToken
  };
};

const resetPassword = async ({ email, resetToken, newPassword }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const isValidReset = consumeResetToken({
    email: normalizedEmail,
    resetToken
  });

  if (!isValidReset) {
    throw new AppError('Invalid or expired reset token. Please verify your code again.', 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  user.password = newPassword;
  await user.save();

  return {
    email: normalizedEmail,
    passwordReset: true
  };
};

module.exports = {
  sendRegistrationCode,
  verifyRegistrationCode,
  registerUser,
  loginUser,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword
};
