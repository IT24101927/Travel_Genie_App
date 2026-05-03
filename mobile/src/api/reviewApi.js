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

export const voteReviewApi = async (id, isHelpful) => {
  const res = await client.post(`/reviews/${id}/helpful`, { isHelpful });
  return res.data;
};

export const flagReviewApi = async (id) => {
  const res = await client.post(`/reviews/${id}/flag`);
  return res.data;
};

export const updateReviewStatusApi = async (id, status) => {
  const res = await client.put(`/reviews/${id}/status`, { status });
  return res.data;
};

export const respondToReviewApi = async (id, comment) => {
  const res = await client.post(`/reviews/${id}/response`, { comment });
  return res.data;
};
