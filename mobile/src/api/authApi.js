import client from './client';

export const sendRegisterCodeApi = async (payload) => {
  const res = await client.post('/auth/register/send-code', payload);
  return res.data;
};

export const verifyRegisterCodeApi = async (payload) => {
  const res = await client.post('/auth/register/verify-code', payload);
  return res.data;
};

export const registerApi = async (payload) => {
  const res = await client.post('/auth/register', payload);
  return res.data;
};

export const loginApi = async (payload) => {
  const res = await client.post('/auth/login', payload);
  return res.data;
};

export const meApi = async () => {
  const res = await client.get('/auth/me');
  return res.data;
};

export const forgotPasswordRequestApi = async (payload) => {
  const res = await client.post('/auth/password-reset/request', payload);
  return res.data;
};

export const forgotPasswordVerifyCodeApi = async (payload) => {
  const res = await client.post('/auth/password-reset/verify-code', payload);
  return res.data;
};

export const forgotPasswordResetApi = async (payload) => {
  const res = await client.post('/auth/password-reset/reset', payload);
  return res.data;
};
