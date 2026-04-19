const crypto = require('crypto');

const resetCodeStore = new Map();
const resetVerifiedStore = new Map();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const createResetCode = () => String(Math.floor(100000 + Math.random() * 900000));

const issueResetCode = ({ email, expiresInMinutes = 15 }) => {
  const normalizedEmail = normalizeEmail(email);
  const code = createResetCode();
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  resetCodeStore.set(normalizedEmail, {
    email: normalizedEmail,
    code,
    expiresAt,
    attempts: 0
  });

  resetVerifiedStore.delete(normalizedEmail);

  return { code, expiresAt };
};

const verifyResetCode = ({ email, code, maxAttempts = 5 }) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = resetCodeStore.get(normalizedEmail);

  if (!entry) {
    return { ok: false, reason: 'NO_CODE' };
  }

  if (Date.now() > entry.expiresAt) {
    resetCodeStore.delete(normalizedEmail);
    return { ok: false, reason: 'EXPIRED' };
  }

  if (entry.attempts >= maxAttempts) {
    resetCodeStore.delete(normalizedEmail);
    return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };
  }

  if (String(code) !== String(entry.code)) {
    entry.attempts += 1;
    resetCodeStore.set(normalizedEmail, entry);
    return { ok: false, reason: 'INVALID' };
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  resetVerifiedStore.set(normalizedEmail, {
    resetToken,
    verifiedAt: Date.now()
  });
  resetCodeStore.delete(normalizedEmail);

  return { ok: true, resetToken };
};

const consumeResetToken = ({ email, resetToken }) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = resetVerifiedStore.get(normalizedEmail);

  if (!entry || entry.resetToken !== resetToken) {
    return false;
  }

  resetVerifiedStore.delete(normalizedEmail);
  return true;
};

module.exports = {
  issueResetCode,
  verifyResetCode,
  consumeResetToken
};
