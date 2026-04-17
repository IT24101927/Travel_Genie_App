import client from './client';

export const getHotelsApi = async (params = {}) => {
  const res = await client.get('/hotels', { params });
  return res.data;
};
