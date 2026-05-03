import client from './client';

export const adminLoginApi = async (payload) => {
  const res = await client.post('/admin/login', payload);
  return res.data;
};

export const adminStatsApi = async () => {
  const res = await client.get('/admin/stats');
  return res.data;
};

export const adminListUsersApi = async () => {
  const res = await client.get('/admin/users');
  return res.data;
};

export const adminCreateUserApi = async (payload) => {
  const res = await client.post('/admin/users', payload);
  return res.data;
};

export const adminUpdateUserApi = async (userId, payload) => {
  const res = await client.put(`/admin/users/${userId}`, payload);
  return res.data;
};

export const adminDeleteUserApi = async (userId) => {
  const res = await client.delete(`/admin/users/${userId}`);
  return res.data;
};

export const adminResetUserPasswordApi = async (userId, payload) => {
  const res = await client.post(`/admin/users/${userId}/reset-password`, payload);
  return res.data;
};

export const adminListResourceApi = async (resource) => {
  const res = await client.get(`/admin/resources/${resource}`);
  return res.data;
};
