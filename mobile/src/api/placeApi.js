import client from './client';

export const getPlacesApi = async (params = {}) => {
  const res = await client.get('/places', { params });
  return res.data;
};

export const getPlaceApi = async (id) => {
  const res = await client.get(`/places/${id}`);
  return res.data;
};

export const createPlaceApi = async (payload) => {
  const res = await client.post('/places', payload);
  return res.data;
};

export const updatePlaceApi = async (id, payload) => {
  const res = await client.put(`/places/${id}`, payload);
  return res.data;
};

export const deletePlaceApi = async (id) => {
  const res = await client.delete(`/places/${id}`);
  return res.data;
};
