const Place = require('./place.model');
const District = require('./district.model');
const AppError = require('../../utils/appError');

const createPlace = async (userId, payload) => {
  return Place.create({ ...payload, createdBy: userId });
};

const getPlaces = async (query) => {
  const and = [];

  // District filter — numeric districtId (seeded data) or district name string (admin-created)
  if (query.districtId) {
    and.push({ district_id: parseInt(query.districtId) });
  } else if (query.district) {
    const d = await District.findOne({ name: new RegExp(`^${query.district}$`, 'i') });
    if (d) {
      and.push({ $or: [{ district_id: d.district_id }, { district: new RegExp(query.district, 'i') }] });
    } else {
      and.push({ district: new RegExp(query.district, 'i') });
    }
  }

  // Category filter — `category` (admin-created) or `type` (seeded) are both populated
  if (query.category) {
    const rx = new RegExp(query.category, 'i');
    and.push({ $or: [{ category: rx }, { type: rx }] });
  }

  // Full-text search
  if (query.search) {
    const rx = new RegExp(query.search, 'i');
    and.push({ $or: [{ name: rx }, { description: rx }, { tags: rx }] });
  }

  const base = { isActive: true };
  const filter = and.length ? { ...base, $and: and } : base;
  return Place.find(filter).sort({ rating: -1, createdAt: -1 });
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
