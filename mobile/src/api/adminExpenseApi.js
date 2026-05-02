import client from './client';

export const getAdminAllExpensesApi = async (params = {}) => {
  const res = await client.get('/expenses/admin/all', { params });
  return res.data;
};

export const getAdminPriceRecordsApi = async (params = {}) => {
  const res = await client.get('/expenses/admin/price-records', { params });
  return res.data;
};

export const createAdminPriceRecordApi = async (payload) => {
  const res = await client.post('/expenses/admin/price-records', payload);
  return res.data;
};

export const deleteAdminPriceRecordApi = async (id) => {
  const res = await client.delete(`/expenses/admin/price-records/${id}`);
  return res.data;
};

export const updateAdminPriceRecordApi = async (id, payload) => {
  const res = await client.patch(`/expenses/admin/price-records/${id}`, payload);
  return res.data;
};

export const getAdminTripsBudgetHealthApi = async () => {
  const res = await client.get('/expenses/admin/trips-budget');
  return res.data;
};

export const getAdminAlertHistoryApi = async () => {
  const res = await client.get('/expenses/admin/alerts-history');
  return res.data;
};

export const sendBudgetAlertApi = async (payload) => {
  const res = await client.post('/notifications', payload);
  return res.data;
};

