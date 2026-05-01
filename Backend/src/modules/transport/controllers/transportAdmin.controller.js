const TransportSchedule = require('../models/TransportSchedule');
const asyncHandler = require('../../../utils/asyncHandler');
const AppError = require('../../../utils/appError');
const { sendSuccess } = require('../../../utils/apiResponse');

const numericOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSchedulePayload = (payload) => {
  const operatingDays = Array.isArray(payload.operatingDays)
    ? payload.operatingDays
    : String(payload.operatingDays || 'Daily')
      .split(',')
      .map((day) => day.trim())
      .filter(Boolean);

  return {
    ...payload,
    district_id: numericOrNull(payload.district_id),
    duration: Number(payload.duration) || 0,
    ticketPriceLKR: Number(payload.ticketPriceLKR) || 0,
    popularityScore: Number(payload.popularityScore) || 0,
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : String(payload.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    bookingChannel: payload.bookingChannel || 'local-check',
    paymentNotes: String(payload.paymentNotes || '').trim(),
    operatingDays: operatingDays.length ? operatingDays : ['Daily'],
    isActive: payload.isActive !== false
  };
};

const buildScheduleQuery = (queryParams = {}, { activeOnly = false } = {}) => {
  const filter = {};
  const districtId = numericOrNull(queryParams.districtId || queryParams.district_id);
  const search = String(queryParams.search || '').trim();

  if (activeOnly) filter.isActive = true;
  if (districtId) filter.district_id = districtId;
  if (queryParams.type) filter.type = queryParams.type;
  if (queryParams.province) filter.province = queryParams.province;
  if (queryParams.district) {
    filter.district = new RegExp(`^${escapeRegex(String(queryParams.district).trim())}$`, 'i');
  }

  if (queryParams.from) {
    const fromRegex = new RegExp(escapeRegex(String(queryParams.from).trim()), 'i');
    filter.$or = filter.$or || [];
    filter.$or.push({ $or: [{ departureStation: fromRegex }, { district: fromRegex }] });
  }

  if (queryParams.to) {
    const toRegex = new RegExp(escapeRegex(String(queryParams.to).trim()), 'i');
    filter.$or = filter.$or || [];
    filter.$or.push({ $or: [{ arrivalStation: toRegex }, { district: toRegex }] });
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    filter.$or = filter.$or || [];
    filter.$or.push({
      $or: [
        { provider: searchRegex },
        { routeName: searchRegex },
        { routeNo: searchRegex },
        { departureStation: searchRegex },
        { arrivalStation: searchRegex },
        { district: searchRegex },
        { province: searchRegex },
        { bookingChannel: searchRegex },
        { tags: searchRegex }
      ]
    });
  }

  if (filter.$or && filter.$or.length > 0) {
    filter.$and = filter.$or;
    delete filter.$or;
  }

  return filter;
};

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

const listSchedules = async (queryParams, options = {}) => {
  const filter = buildScheduleQuery(queryParams, options);

  const page = Math.max(1, parseInt(queryParams.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(queryParams.limit) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;

  const [schedules, total] = await Promise.all([
    TransportSchedule.find(filter)
      .sort({ popularityScore: -1, district_id: 1, departureTime: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TransportSchedule.countDocuments(filter)
  ]);

  return { schedules, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const createTransportSchedule = asyncHandler(async (req, res) => {
  const schedule = await TransportSchedule.create(normalizeSchedulePayload(req.body));
  return sendSuccess(res, 201, 'Transport schedule added successfully', { schedule });
});

const getTransportSchedules = asyncHandler(async (req, res) => {
  const { schedules, total, page, limit, totalPages } = await listSchedules(req.query);
  return sendSuccess(res, 200, 'Transport schedules fetched successfully', { schedules, total, page, limit, totalPages });
});

const getPublicTransportSchedules = asyncHandler(async (req, res) => {
  const { schedules, total, page, limit, totalPages } = await listSchedules(req.query, { activeOnly: true });
  return sendSuccess(res, 200, 'Transport schedules fetched successfully', { schedules, total, page, limit, totalPages });
});

const getPublicTransportDistricts = asyncHandler(async (req, res) => {
  const limit = Math.min(25, Math.max(1, parseInt(req.query.limit) || 10));

  const districts = await TransportSchedule.aggregate([
    {
      $match: {
        isActive: true,
        district: { $type: 'string', $ne: '' }
      }
    },
    { $sort: { popularityScore: -1, ticketPriceLKR: 1, departureTime: 1 } },
    {
      $group: {
        _id: {
          district_id: '$district_id',
          district: '$district',
          province: '$province'
        },
        routeCount: { $sum: 1 },
        lowestPrice: { $min: '$ticketPriceLKR' },
        popularityScore: { $max: '$popularityScore' },
        sample: {
          $first: {
            type: '$type',
            provider: '$provider',
            routeName: '$routeName',
            routeNo: '$routeNo',
            serviceClass: '$serviceClass',
            departureStation: '$departureStation',
            arrivalStation: '$arrivalStation',
            departureTime: '$departureTime',
            arrivalTime: '$arrivalTime',
            duration: '$duration',
            bookingChannel: '$bookingChannel',
            ticketPriceLKR: '$ticketPriceLKR'
          }
        }
      }
    },
    { $sort: { routeCount: -1, popularityScore: -1, '_id.district_id': 1, '_id.district': 1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        district_id: '$_id.district_id',
        district: '$_id.district',
        province: '$_id.province',
        routeCount: 1,
        lowestPrice: 1,
        popularityScore: 1,
        sample: 1
      }
    }
  ]);

  return sendSuccess(res, 200, 'Popular transport districts fetched successfully', { districts });
});

const getTransportSchedule = asyncHandler(async (req, res) => {
  const schedule = await TransportSchedule.findById(req.params.id).lean();
  if (!schedule) {
    throw new AppError('No schedule found with that ID', 404);
  }
  return sendSuccess(res, 200, 'Transport schedule fetched successfully', { schedule });
});

const updateTransportSchedule = asyncHandler(async (req, res) => {
  const schedule = await TransportSchedule.findByIdAndUpdate(
    req.params.id,
    normalizeSchedulePayload(req.body),
    { new: true, runValidators: true }
  );

  if (!schedule) {
    throw new AppError('No schedule found with that ID', 404);
  }

  return sendSuccess(res, 200, 'Transport schedule updated successfully', { schedule });
});

const deleteTransportSchedule = asyncHandler(async (req, res) => {
  const schedule = await TransportSchedule.findByIdAndDelete(req.params.id);
  if (!schedule) {
    throw new AppError('No schedule found with that ID', 404);
  }
  return sendSuccess(res, 200, 'Transport schedule deleted successfully');
});

module.exports = {
  createTransportSchedule,
  getTransportSchedules,
  getPublicTransportSchedules,
  getPublicTransportDistricts,
  getTransportSchedule,
  updateTransportSchedule,
  deleteTransportSchedule
};
