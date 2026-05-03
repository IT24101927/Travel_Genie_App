import client from './client';

export const getReviewsApi = async (params = {}) => {
  const res = await client.get('/reviews', { params });
  return res.data;
};

export const createReviewApi = async (payload) => {
  const res = await client.post('/reviews', payload);
  return res.data;
};

export const updateReviewApi = async (id, payload) => {
  const res = await client.put(`/reviews/${id}`, payload);
  return res.data;
};

export const deleteReviewApi = async (id) => {
  const res = await client.delete(`/reviews/${id}`);
  return res.data;
};
