const PriceRecord = require('./priceRecord.model');
const Expense = require('./expense.model');
const Place = require('../places/place.model');
const Notification = require('../notifications/notification.model');
const Trip = require('../trips/trip.model');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const AppError = require('../../utils/appError');

// @desc    Get all expenses (admin)
// @route   GET /api/v1/expenses/admin/all
exports.getAllExpensesAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const total = await Expense.countDocuments();
  const expenses = await Expense.find()
    .populate('userId', 'fullName email')
    .populate('tripId', 'title')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  return sendSuccess(res, 200, 'All expenses fetched successfully', {
    expenses,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get all price records
// @route   GET /api/v1/expenses/admin/price-records
exports.getPriceRecords = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const records = await PriceRecord.find()
    .populate('place', 'name place_id district')
    .sort({ recorded_at: -1 })
    .limit(limit);

  return sendSuccess(res, 200, 'Price records fetched successfully', { records });
});

// @desc    Create a price record
// @route   POST /api/v1/expenses/admin/price-records
exports.createPriceRecord = asyncHandler(async (req, res) => {
  const { place_id, item_type, price, activity_name, category } = req.body;

  if (!item_type || price === undefined) {
    throw new AppError('Missing required fields', 400);
  }

  const record = await PriceRecord.create({ 
    place_id, 
    item_type, 
    price,
    category: item_type === 'activity' ? category : 'other',
    activity_name: item_type === 'activity' ? activity_name : undefined
  });
  const populated = await PriceRecord.findById(record._id).populate('place', 'name');

  return sendSuccess(res, 201, 'Price record created successfully', { record: populated });
});

// @desc    Update a price record
// @route   PATCH /api/v1/expenses/admin/price-records/:id
exports.updatePriceRecord = asyncHandler(async (req, res) => {
  const { place_id, item_type, price, activity_name, category } = req.body;
  
  let record = await PriceRecord.findById(req.params.id);
  if (!record) throw new AppError('Price record not found', 404);

  record.place_id = place_id || record.place_id;
  record.item_type = item_type || record.item_type;
  record.price = price !== undefined ? price : record.price;
  record.category = item_type === 'activity' ? (category || record.category) : 'other';
  record.activity_name = item_type === 'activity' ? (activity_name || record.activity_name) : undefined;

  await record.save();
  const populated = await PriceRecord.findById(record._id).populate('place', 'name');

  return sendSuccess(res, 200, 'Price record updated successfully', { record: populated });
});

// @desc    Delete a price record
// @route   DELETE /api/v1/expenses/admin/price-records/:id
exports.deletePriceRecord = asyncHandler(async (req, res) => {
  const record = await PriceRecord.findById(req.params.id);
  if (!record) throw new AppError('Price record not found', 404);

  await record.deleteOne();
  return sendSuccess(res, 200, 'Price record deleted successfully');
});

// @desc    Get all trips (admin summary for budget health)
// @route   GET /api/v1/expenses/admin/trips-budget
exports.getTripsBudgetHealth = asyncHandler(async (req, res) => {
  // Get all trips with their budget info
  const trips = await Trip.find()
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, 'Trips budget health fetched successfully', { trips });
});

// @desc    Get alert history
// @route   GET /api/v1/expenses/admin/alerts-history
exports.getAlertHistory = asyncHandler(async (req, res) => {
  const alerts = await Notification.find({ type: 'BUDGET_100' })
    .populate('userId', 'fullName email')
    .populate('tripId', 'title')
    .sort({ createdAt: -1 })
    .limit(100);

  return sendSuccess(res, 200, 'Alert history fetched successfully', { alerts });
});
