import client from './client';

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
