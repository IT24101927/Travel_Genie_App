import client from './client';

export const getNotificationsApi = async () => {
  const res = await client.get('/notifications');
  return res.data;
};

export const markNotificationReadApi = async (id) => {
  const res = await client.patch(`/notifications/${id}/read`);
  return res.data;
};

export const deleteNotificationApi = async (id) => {
  const res = await client.delete(`/notifications/${id}`);
  return res.data;
};
