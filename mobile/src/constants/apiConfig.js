import Constants from 'expo-constants';

const fromExpoExtra = Constants?.expoConfig?.extra?.apiBaseUrl;
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

export const API_BASE_URL = fromEnv || fromExpoExtra || 'http://10.0.2.2:5000/api/v1';

const SERVER_BASE = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
const INVALID_IMAGE_VALUES = new Set(['', 'null', 'undefined', 'none', 'n/a', 'na', '-']);

const isLocalHttpUrl = (uri) =>
  /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(uri);

export const getImageUrl = (uri) => {
  const value = String(uri || '').trim();
  if (!value || INVALID_IMAGE_VALUES.has(value.toLowerCase())) return null;

  const normalized = value.replace(/\\/g, '/');

  if (/^(data|file|content|asset):/i.test(normalized)) return normalized;
  if (normalized.startsWith('//')) return encodeURI(`https:${normalized}`);
  if (/^https:\/\//i.test(normalized)) return encodeURI(normalized);
  if (/^http:\/\//i.test(normalized)) {
    const absoluteUrl = isLocalHttpUrl(normalized) ? normalized : normalized.replace(/^http:\/\//i, 'https://');
    return encodeURI(absoluteUrl);
  }

  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${SERVER_BASE}${encodeURI(path)}`;
};
