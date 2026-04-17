const Expense = require('./expense.model');
const Trip = require('../trips/trip.model');
const AppError = require('../../utils/appError');

const ensureTripOwnership = async (tripId, userId, role) => {
  const filter = role === 'admin' ? { _id: tripId } : { _id: tripId, userId };
  const trip = await Trip.findOne(filter);

  if (!trip) {
    throw new AppError('Trip not found or not accessible', 404);
  }

  return trip;
};

const createExpense = async (user, payload) => {
  await ensureTripOwnership(payload.tripId, user.userId, user.role);
  return Expense.create({
    ...payload,
    userId: user.userId
  });
};

const getExpenses = async (user, query) => {
  const filter = user.role === 'admin' ? {} : { userId: user.userId };

  if (query.tripId) {
    filter.tripId = query.tripId;
  }

  if (query.category) {
    filter.category = query.category;
  }

  return Expense.find(filter)
    .populate('tripId', 'title destination budget')
    .sort({ date: -1, createdAt: -1 });
};

const getExpenseById = async (expenseId, user) => {
  const filter = user.role === 'admin' ? { _id: expenseId } : { _id: expenseId, userId: user.userId };

  const expense = await Expense.findOne(filter).populate('tripId', 'title destination budget');
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return expense;
};

const updateExpense = async (expenseId, user, payload) => {
  const expense = await getExpenseById(expenseId, user);

  if (payload.tripId) {
    await ensureTripOwnership(payload.tripId, user.userId, user.role);
  }

  Object.assign(expense, payload);
  await expense.save();

  return expense;
};

const deleteExpense = async (expenseId, user) => {
  const expense = await getExpenseById(expenseId, user);
  await expense.deleteOne();
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};
