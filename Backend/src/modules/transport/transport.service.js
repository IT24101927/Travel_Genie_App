const Transport = require('./models/Transport');
const Trip = require('../trips/models/trip.model');
const AppError = require('../../utils/appError');

const verifyTripAccess = async (tripId, userId, role) => {
  const filter = role === 'admin' ? { _id: tripId } : { _id: tripId, userId };
  const trip = await Trip.findOne(filter);
  if (!trip) throw new AppError('Trip not found or not accessible', 404);
  return trip;
};

const createTransport = async (user, payload) => {
  if (payload.tripId) {
    await verifyTripAccess(payload.tripId, user.userId, user.role);
  }
  return Transport.create({ ...payload, userId: user.userId });
};

const getTransports = async (user, query) => {
  const filter = user.role === 'admin' ? {} : { userId: user.userId };

  if (query.tripId) filter.tripId = query.tripId;
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;

  return Transport.find(filter)
    .populate('tripId', 'title destination')
    .sort({ departureDate: -1, createdAt: -1 });
};

const getTransportById = async (id, user) => {
  const filter = user.role === 'admin' ? { _id: id } : { _id: id, userId: user.userId };
  const transport = await Transport.findOne(filter).populate('tripId', 'title destination');
  if (!transport) throw new AppError('Transport record not found', 404);
  return transport;
};

const updateTransport = async (id, user, payload) => {
  const transport = await getTransportById(id, user);
  if (payload.tripId) {
    await verifyTripAccess(payload.tripId, user.userId, user.role);
  }
  Object.assign(transport, payload);
  await transport.save();
  return transport;
};

const deleteTransport = async (id, user) => {
  const transport = await getTransportById(id, user);
  await transport.deleteOne();
};

module.exports = {
  createTransport,
  getTransports,
  getTransportById,
  updateTransport,
  deleteTransport
};
