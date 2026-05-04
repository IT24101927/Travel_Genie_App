const express = require('express');

const { protect } = require('../../../middleware/authMiddleware');
const validateRequest = require('../../../middleware/validateMiddleware');
const { createExpenseValidation, updateExpenseValidation } = require('../expense.validation');
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
} = require('../controllers/expense.controller');
const {
  getAllExpensesAdmin,
  getPriceRecords,
  createPriceRecord,
  updatePriceRecord,
  deletePriceRecord,
  getTripsBudgetHealth,
  getAlertHistory
} = require('../controllers/adminExpense.controller');
const { authorize } = require('../../../middleware/roleMiddleware');


const router = express.Router();

router.use(protect);

router.get('/summary/user-total', getUserExpenseTotalHandler);
router.get('/summary/recent', getRecentExpensesHandler);
router.get('/summary/trip/:tripId', getTripExpenseTotalHandler);
router.get('/summary/budget-usage/:tripId', getBudgetUsageHandler);
router.get('/price-records', getPriceRecords);

router.post('/', createExpenseValidation, validateRequest, createExpenseHandler);
router.get('/', getExpensesHandler);
router.get('/:id', getExpenseHandler);
router.put('/:id', updateExpenseValidation, validateRequest, updateExpenseHandler);
router.delete('/:id', deleteExpenseHandler);

/* ── Admin Routes ── */
router.use(authorize('admin'));
router.get('/admin/all', getAllExpensesAdmin);
router.get('/admin/price-records', getPriceRecords); // Keep admin version if needed, or just use the other one
router.post('/admin/price-records', createPriceRecord);
router.patch('/admin/price-records/:id', updatePriceRecord);
router.delete('/admin/price-records/:id', deletePriceRecord);
router.get('/admin/trips-budget', getTripsBudgetHealth);
router.get('/admin/alerts-history', getAlertHistory);

module.exports = router;
