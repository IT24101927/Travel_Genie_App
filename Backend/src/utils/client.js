import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default client;
