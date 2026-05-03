import client from './client';

export const getTransportsApi = async (params = {}) => {
  const res = await client.get('/transport', { params });
  return res.data;
};

export const getTransportApi = async (id) => {
  const res = await client.get(`/transport/${id}`);
  return res.data;
};

export const createTransportApi = async (payload) => {
  const res = await client.post('/transport', payload);
  return res.data;
};

export const updateTransportApi = async (id, payload) => {
  const res = await client.put(`/transport/${id}`, payload);
  return res.data;
};

export const deleteTransportApi = async (id) => {
  const res = await client.delete(`/transport/${id}`);
  return res.data;
};
