import client from './client';

export const getNotificationsApi = async () => {
  const res = await client.get('/notifications');
  return res.data;
};
