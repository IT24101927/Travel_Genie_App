export const isEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

export const validateName = (value) => {
  if (!value || !value.trim()) {
    return { valid: false, message: 'Name is required.' };
  }
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: 'Name must be less than 100 characters.' };
  }
  if (/[^a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.\-']/.test(trimmed)) {
    return { valid: false, message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods.' };
  }
  return { valid: true, message: '' };
};

export const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);

export const validatePhone = (value) => {
  if (!value) return { valid: false, message: 'Phone is required.' };
  if (!/^0\d{9}$/.test(value)) {
    return { valid: false, message: 'Phone number must be exactly 10 digits and start with 0.' };
  }
  return { valid: true, message: '' };
};

export const validateNic = (value) => {
  if (!value) return { valid: false, message: 'NIC is required.' };
  const nic = value.trim();
  if (!/^\d{12}$/.test(nic) && !/^\d{9}[VvXx]$/.test(nic)) {
    return { valid: false, message: 'NIC must be either 12 digits or 9 digits followed by V/X.' };
  }
  return { valid: true, message: '' };
};

export const validatePassword = (value) => {
  if (!value) {
    return { valid: false, message: 'Password is required.' };
  }
  const missing = [];
  if (value.length < 8) missing.push('8+ characters');
  if (!/[A-Z]/.test(value)) missing.push('uppercase letter');
  if (!/[a-z]/.test(value)) missing.push('lowercase letter');
  if (!/\d/.test(value)) missing.push('number');
  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(value)) missing.push('special character');
  if (missing.length > 0) {
    return { valid: false, message: `Password needs: ${missing.join(', ')}.` };
  }
  return { valid: true, message: '' };
};

export const validateEmail = (value) => {
  if (!value || !String(value).trim()) {
    return { valid: false, message: 'Email is required.' };
  }
  const trimmed = String(value).trim();
  if (!trimmed.includes('@') || trimmed.endsWith('@')) {
    return { valid: false, message: 'Email must include @ followed by a domain (e.g. name@example.com).' };
  }
  const afterAt = trimmed.split('@').slice(1).join('@');
  if (!afterAt || !afterAt.includes('.') || afterAt.startsWith('.') || afterAt.endsWith('.')) {
    return { valid: false, message: 'Email domain must include a suffix like .com or .org (e.g. name@example.com).' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address (e.g. name@example.com).' };
  }
  return { valid: true, message: '' };
};

export const isStrongPassword = (value) => String(value || '').length >= 6;

export const isRequired = (value) => String(value || '').trim().length > 0;
