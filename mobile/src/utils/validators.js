export const isEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

export const isStrongPassword = (value) => String(value || '').length >= 6;

export const isRequired = (value) => String(value || '').trim().length > 0;
