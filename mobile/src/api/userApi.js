import client from './client';

export const getMyProfileApi = async () => {
  const res = await client.get('/users/me');
  return res.data;
};

export const changePasswordApi = async (payload) => {
  const res = await client.post('/users/me/change-password', payload);
  return res.data;
};

export const deleteAccountApi = async (payload) => {
  const res = await client.delete('/users/me', { data: payload });
  return res.data;
};

export const updateMyProfileApi = async (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'profileImage') {
        formData.append(key, value);
      } else if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });

  const res = await client.put('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return res.data;
};
