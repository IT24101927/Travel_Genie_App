const Hotel = require('./hotel.model');
const AppError = require('../../utils/appError');

const createHotel = async (userId, payload) => {
  return Hotel.create({ ...payload, createdBy: userId });
};

const getHotels = async (query) => {
  const filter = {};

  if (query.location) {
    filter.location = new RegExp(query.location, 'i');
  }

  if (query.minPrice || query.maxPrice) {
    filter.priceRange = {};
    if (query.minPrice) {
      filter.priceRange.$gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      filter.priceRange.$lte = Number(query.maxPrice);
    }
  }

  if (query.minRating) {
    filter.rating = { $gte: Number(query.minRating) };
  }

  return Hotel.find(filter).sort({ rating: -1, createdAt: -1 });
};

const getHotelById = async (id) => {
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }
  return hotel;
};

const updateHotel = async (id, payload) => {
  const hotel = await getHotelById(id);
  Object.assign(hotel, payload);
  await hotel.save();
  return hotel;
};

const deleteHotel = async (id) => {
  const hotel = await getHotelById(id);
  await hotel.deleteOne();
};

module.exports = {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel
};
