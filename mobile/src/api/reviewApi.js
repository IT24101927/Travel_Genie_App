import client from './client';

export const createReviewApi = async (payload) => {
  const res = await client.post('/reviews', payload);
  return res.data;
};
