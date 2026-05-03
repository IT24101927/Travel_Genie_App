import client from './client';

export const getTripsApi = async () => {
  const res = await client.get('/trips');
  return res.data;
};

export const getTripApi = async (id) => {
  const res = await client.get(`/trips/${id}`);
  return res.data;
};

export const createTripApi = async (payload) => {
  const res = await client.post('/trips', payload);
  return res.data;
};

export const updateTripApi = async (id, payload) => {
  const res = await client.put(`/trips/${id}`, payload);
  return res.data;
};

export const deleteTripApi = async (id) => {
  const res = await client.delete(`/trips/${id}`);
  return res.data;
};
