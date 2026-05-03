const crypto = require('crypto');

const codeStore = new Map();
const verifiedStore = new Map();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const createVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

const issueCode = ({ email, expiresInMinutes = 10 }) => {
  const normalizedEmail = normalizeEmail(email);
  const code = createVerificationCode();
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

  codeStore.set(normalizedEmail, {
    email: normalizedEmail,
    code,
    expiresAt,
    attempts: 0
  });

  verifiedStore.delete(normalizedEmail);

  return { code, expiresAt };
};

const verifyCode = ({ email, code, maxAttempts = 5 }) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = codeStore.get(normalizedEmail);

  if (!entry) {
    return { ok: false, reason: 'NO_CODE' };
  }

  if (Date.now() > entry.expiresAt) {
    codeStore.delete(normalizedEmail);
    return { ok: false, reason: 'EXPIRED' };
  }

  if (entry.attempts >= maxAttempts) {
    codeStore.delete(normalizedEmail);
    return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };
  }

  if (String(code) !== String(entry.code)) {
    entry.attempts += 1;
    codeStore.set(normalizedEmail, entry);
    return { ok: false, reason: 'INVALID' };
  }

  const verificationToken = crypto.randomBytes(24).toString('hex');
  verifiedStore.set(normalizedEmail, {
    verificationToken,
    verifiedAt: Date.now()
  });
  codeStore.delete(normalizedEmail);

  return { ok: true, verificationToken };
};

const consumeVerificationToken = ({ email, verificationToken }) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = verifiedStore.get(normalizedEmail);

  if (!entry || entry.verificationToken !== verificationToken) {
    return false;
  }

  verifiedStore.delete(normalizedEmail);
  return true;
};

const isTokenValid = ({ email, verificationToken }) => {
  const normalizedEmail = normalizeEmail(email);
  const entry = verifiedStore.get(normalizedEmail);
  return !!(entry && entry.verificationToken === verificationToken);
};

module.exports = {
  issueCode,
  verifyCode,
  consumeVerificationToken,
  isTokenValid
};
