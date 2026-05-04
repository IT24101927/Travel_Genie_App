const Trip = require('./models/trip.model');
const AppError = require('../../utils/appError');

const createTrip = async (userId, payload) => {
  return Trip.create({ ...payload, userId });
};

const getUserTrips = async (userId) => {
  return Trip.find({ userId }).sort({ startDate: -1 });
};

const getTripById = async (tripId, userId, role) => {
  const filter = role === 'admin' ? { _id: tripId } : { _id: tripId, userId };
  const trip = await Trip.findOne(filter);

  if (!trip) {
    throw new AppError('Trip not found', 404);
  }

  return trip;
};

const updateTrip = async (tripId, userId, role, payload) => {
  const trip = await getTripById(tripId, userId, role);
  Object.assign(trip, payload);
  await trip.save();
  return trip;
};

const deleteTrip = async (tripId, userId, role) => {
  const trip = await getTripById(tripId, userId, role);
  await trip.deleteOne();
};

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip
};
