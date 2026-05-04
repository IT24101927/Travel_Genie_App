const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip
} = require('../trip.service');


const createTripHandler = asyncHandler(async (req, res) => {
  const trip = await createTrip(req.user.userId, req.body);
  return sendSuccess(res, 201, 'Trip created successfully', { trip });
});

const getTripsHandler = asyncHandler(async (req, res) => {
  const trips = await getUserTrips(req.user.userId);
  return sendSuccess(res, 200, 'Trips fetched successfully', { trips });
});

const getTripHandler = asyncHandler(async (req, res) => {
  const trip = await getTripById(req.params.id, req.user.userId, req.user.role);
  return sendSuccess(res, 200, 'Trip fetched successfully', { trip });
});

const updateTripHandler = asyncHandler(async (req, res) => {
  const trip = await updateTrip(req.params.id, req.user.userId, req.user.role, req.body);
  return sendSuccess(res, 200, 'Trip updated successfully', { trip });
});

const deleteTripHandler = asyncHandler(async (req, res) => {
  await deleteTrip(req.params.id, req.user.userId, req.user.role);
  return sendSuccess(res, 200, 'Trip deleted successfully');
});

module.exports = {
  createTripHandler,
  getTripsHandler,
  getTripHandler,
  updateTripHandler,
  deleteTripHandler
};
