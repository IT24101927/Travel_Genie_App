const Place = require('./place.model');
const AppError = require('../../utils/appError');

const createPlace = async (userId, payload) => {
  return Place.create({ ...payload, createdBy: userId });
};

const getPlaces = async (query) => {
  const filter = {};

  if (query.district) {
    filter.district = new RegExp(query.district, 'i');
  }

  if (query.category) {
    filter.category = new RegExp(query.category, 'i');
  }

  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, 'i') },
      { description: new RegExp(query.search, 'i') },
      { tags: new RegExp(query.search, 'i') }
    ];
  }

  return Place.find(filter).sort({ createdAt: -1 });
};

const getPlaceById = async (id) => {
  const place = await Place.findById(id);
  if (!place) {
    throw new AppError('Place not found', 404);
  }
  return place;
};

const updatePlace = async (id, payload) => {
  const place = await getPlaceById(id);
  Object.assign(place, payload);
  await place.save();
  return place;
};

const deletePlace = async (id) => {
  const place = await getPlaceById(id);
  await place.deleteOne();
};

module.exports = {
  createPlace,
  getPlaces,
  getPlaceById,
  updatePlace,
  deletePlace
};
