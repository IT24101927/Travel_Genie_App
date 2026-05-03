import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  createExpenseApi,
  deleteExpenseApi,
  getBudgetUsageApi,
  getExpensesApi,
  getRecentExpensesApi,
  getUserExpenseTotalApi,
  updateExpenseApi
} from '../api/expenseApi';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const fetchExpenses = useCallback(async (params = {}) => {
    setLoadingExpenses(true);
    try {
      const response = await getExpensesApi(params);
      const data = response?.data?.expenses || [];
      setExpenses(data);
      return data;
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const createExpense = useCallback(async (payload) => {
    const response = await createExpenseApi(payload);
    return response?.data?.expense;
  }, []);

  const updateExpense = useCallback(async (id, payload) => {
    const response = await updateExpenseApi(id, payload);
    return response?.data?.expense;
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await deleteExpenseApi(id);
  }, []);

  const getUserTotal = useCallback(async () => {
    const response = await getUserExpenseTotalApi();
    return response?.data || {};
  }, []);

  const getRecent = useCallback(async (limit = 5) => {
    const response = await getRecentExpensesApi(limit);
    return response?.data?.recentExpenses || [];
  }, []);

  const getBudgetUsage = useCallback(async (tripId) => {
    const response = await getBudgetUsageApi(tripId);
    return response?.data || {};
  }, []);

  const value = useMemo(() => ({
    expenses,
    loadingExpenses,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getUserTotal,
    getRecent,
    getBudgetUsage
  }), [expenses, loadingExpenses, fetchExpenses, createExpense, updateExpense, deleteExpense, getUserTotal, getRecent, getBudgetUsage]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpense = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) {
    throw new Error('useExpense must be used inside ExpenseProvider');
  }
  return ctx;
};
