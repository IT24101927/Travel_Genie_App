import client from './client';

export const getMyProfileApi = async () => {
  const res = await client.get('/users/me');
  return res.data;
};

export const updateMyProfileApi = async (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });

  const res = await client.put('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return res.data;
};
