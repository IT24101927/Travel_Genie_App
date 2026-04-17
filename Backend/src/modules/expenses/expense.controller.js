const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('./expense.service');
const {
  getTripExpenseTotal,
  getUserExpenseTotal,
  getBudgetUsage,
  getRecentExpenses
} = require('./expense.summary.service');

const createExpenseHandler = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : []
  };

  const expense = await createExpense(req.user, payload);
  return sendSuccess(res, 201, 'Expense created successfully', { expense });
});

const getExpensesHandler = asyncHandler(async (req, res) => {
  const expenses = await getExpenses(req.user, req.query);
  return sendSuccess(res, 200, 'Expenses fetched successfully', { expenses });
});

const getExpenseHandler = asyncHandler(async (req, res) => {
  const expense = await getExpenseById(req.params.id, req.user);
  return sendSuccess(res, 200, 'Expense fetched successfully', { expense });
});

const updateExpenseHandler = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : req.body.tags
  };

  const expense = await updateExpense(req.params.id, req.user, payload);
  return sendSuccess(res, 200, 'Expense updated successfully', { expense });
});

const deleteExpenseHandler = asyncHandler(async (req, res) => {
  await deleteExpense(req.params.id, req.user);
  return sendSuccess(res, 200, 'Expense deleted successfully');
});

const getTripExpenseTotalHandler = asyncHandler(async (req, res) => {
  const summary = await getTripExpenseTotal(req.params.tripId, req.user);
  return sendSuccess(res, 200, 'Trip expense summary fetched successfully', summary);
});

const getUserExpenseTotalHandler = asyncHandler(async (req, res) => {
  const summary = await getUserExpenseTotal(req.user);
  return sendSuccess(res, 200, 'User expense summary fetched successfully', summary);
});

const getBudgetUsageHandler = asyncHandler(async (req, res) => {
  const summary = await getBudgetUsage(req.params.tripId, req.user);
  return sendSuccess(res, 200, 'Budget usage fetched successfully', summary);
});

const getRecentExpensesHandler = asyncHandler(async (req, res) => {
  const recentExpenses = await getRecentExpenses(req.user, req.query.limit || 5);
  return sendSuccess(res, 200, 'Recent expenses fetched successfully', { recentExpenses });
});

module.exports = {
  createExpenseHandler,
  getExpensesHandler,
  getExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getTripExpenseTotalHandler,
  getUserExpenseTotalHandler,
  getBudgetUsageHandler,
  getRecentExpensesHandler
};
