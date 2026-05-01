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

// Fetch public transit schedules for the user
export const getTransportSchedulesApi = async (params = {}) => {
  const res = await client.get('/transport/schedules', { params });
  return res.data;
};

export const getPopularTransportDistrictsApi = async (params = {}) => {
  const res = await client.get('/transport/schedule-districts', { params });
  return res.data;
};

// Admin Endpoints for Transport Schedules (Sri Lankan context)
export const adminGetTransportSchedulesApi = async (params = {}) => {
  const res = await client.get('/admin/transports', { params });
  return res.data;
};

export const adminGetTransportScheduleApi = async (id) => {
  const res = await client.get(`/admin/transports/${id}`);
  return res.data;
};

export const adminCreateTransportScheduleApi = async (payload) => {
  const res = await client.post('/admin/transports', payload);
  return res.data;
};

export const adminUpdateTransportScheduleApi = async (id, payload) => {
  const res = await client.put(`/admin/transports/${id}`, payload);
  return res.data;
};

export const adminDeleteTransportScheduleApi = async (id) => {
  const res = await client.delete(`/admin/transports/${id}`);
  return res.data;
};
