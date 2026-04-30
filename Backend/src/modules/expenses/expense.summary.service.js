const mongoose = require('mongoose');

const Expense = require('./expense.model');
const Trip = require('../trips/trip.model');
const AppError = require('../../utils/appError');

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const getTripExpenseTotal = async (tripId, user) => {
  const tripFilter = user.role === 'admin' ? { _id: tripId } : { _id: tripId, userId: user.userId };
  const trip = await Trip.findOne(tripFilter);

  if (!trip) {
    throw new AppError('Trip not found or not accessible', 404);
  }

  const totalResult = await Expense.aggregate([
    { $match: { tripId: toObjectId(tripId) } },
    { $group: { _id: '$tripId', total: { $sum: '$amount' } } }
  ]);

  return {
    tripId,
    tripTitle: trip.title,
    totalTripExpenses: totalResult[0]?.total || 0
  };
};

const getUserExpenseTotal = async (user) => {
  const match = user.role === 'admin' ? {} : { userId: toObjectId(user.userId) };

  const totalResult = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  return {
    totalUserExpenses: totalResult[0]?.total || 0,
    expenseCount: totalResult[0]?.count || 0
  };
};

const getBudgetUsage = async (tripId, user) => {
  const tripFilter = user.role === 'admin' ? { _id: tripId } : { _id: tripId, userId: user.userId };
  const trip = await Trip.findOne(tripFilter);

  if (!trip) {
    throw new AppError('Trip not found or not accessible', 404);
  }

  const tripTotal = await getTripExpenseTotal(tripId, user);
  const spent = tripTotal.totalTripExpenses;
  const budget = trip.budget || 0;
  const usagePercentage = budget > 0 ? Number(((spent / budget) * 100).toFixed(2)) : 0;

  return {
    tripId,
    tripTitle: trip.title,
    budget,
    totalSpent: spent,
    remainingBudget: budget - spent,
    usagePercentage
  };
};

const getRecentExpenses = async (user, limit = 5) => {
  const filter = user.role === 'admin' ? {} : { userId: user.userId };

  return Expense.find(filter)
    .populate('tripId', 'title destination')
    .sort({ date: -1, createdAt: -1 })
    .limit(Number(limit));
};

module.exports = {
  getTripExpenseTotal,
  getUserExpenseTotal,
  getBudgetUsage,
  getRecentExpenses
};
