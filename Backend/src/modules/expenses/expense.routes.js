const express = require('express');

const { protect } = require('../../middleware/authMiddleware');
const validateRequest = require('../../middleware/validateMiddleware');
const { createExpenseValidation, updateExpenseValidation } = require('./expense.validation');
const {
  createExpenseHandler,
  getExpensesHandler,
  getExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getTripExpenseTotalHandler,
  getUserExpenseTotalHandler,
  getBudgetUsageHandler,
  getRecentExpensesHandler
} = require('./expense.controller');

const router = express.Router();

router.use(protect);

router.get('/summary/user-total', getUserExpenseTotalHandler);
router.get('/summary/recent', getRecentExpensesHandler);
router.get('/summary/trip/:tripId', getTripExpenseTotalHandler);
router.get('/summary/budget-usage/:tripId', getBudgetUsageHandler);

router.post('/', createExpenseValidation, validateRequest, createExpenseHandler);
router.get('/', getExpensesHandler);
router.get('/:id', getExpenseHandler);
router.put('/:id', updateExpenseValidation, validateRequest, updateExpenseHandler);
router.delete('/:id', deleteExpenseHandler);

module.exports = router;
