import client from './client';

export const getPlacesApi = async (params = {}) => {
  const res = await client.get('/places', { params });
  return res.data;
};
