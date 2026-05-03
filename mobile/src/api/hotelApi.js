import client from './client';

export const getHotelsApi = async (params = {}) => {
  const res = await client.get('/hotels', { params });
  return res.data;
};

export const getHotelApi = async (id) => {
  const res = await client.get(`/hotels/${id}`);
  return res.data;
};

export const createHotelApi = async (payload) => {
  const res = await client.post('/hotels', payload);
  return res.data;
};

export const updateHotelApi = async (id, payload) => {
  const res = await client.put(`/hotels/${id}`, payload);
  return res.data;
};

export const deleteHotelApi = async (id) => {
  const res = await client.delete(`/hotels/${id}`);
  return res.data;
};
