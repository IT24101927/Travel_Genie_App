import client from './client';

export const getExpensesApi = async (params = {}) => {
  const res = await client.get('/expenses', { params });
  return res.data;
};

export const createExpenseApi = async (payload) => {
  const res = await client.post('/expenses', payload);
  return res.data;
};

export const updateExpenseApi = async (id, payload) => {
  const res = await client.put(`/expenses/${id}`, payload);
  return res.data;
};

export const deleteExpenseApi = async (id) => {
  const res = await client.delete(`/expenses/${id}`);
  return res.data;
};

export const getTripExpenseSummaryApi = async (tripId) => {
  const res = await client.get(`/expenses/summary/trip/${tripId}`);
  return res.data;
};

export const getUserExpenseTotalApi = async () => {
  const res = await client.get('/expenses/summary/user-total');
  return res.data;
};

export const getBudgetUsageApi = async (tripId) => {
  const res = await client.get(`/expenses/summary/budget-usage/${tripId}`);
  return res.data;
};

export const getRecentExpensesApi = async (limit = 5) => {
  const res = await client.get('/expenses/summary/recent', { params: { limit } });
  return res.data;
};
