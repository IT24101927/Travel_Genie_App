import Constants from 'expo-constants';

const fromExpoExtra = Constants?.expoConfig?.extra?.apiBaseUrl;
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

export const API_BASE_URL = fromEnv || fromExpoExtra || 'http://10.0.2.2:5000/api/v1';
