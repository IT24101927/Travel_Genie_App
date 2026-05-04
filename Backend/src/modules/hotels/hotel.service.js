const Hotel = require('./models/hotel.model');
const District = require('../places/models/district.model');
const Place = require('../places/models/place.model');

const AppError = require('../../utils/appError');

const createHotel = async (userId, payload) => {
  const normalized = await normalizeHotelPayload(payload);
  return Hotel.create({ ...normalized, createdBy: userId });
};

const getHotels = async (query) => {
  const filter = {};

  if (query.includeInactive !== 'true') {
    filter.isActive = { $ne: false };
  }

  if (query.location || query.search) {
    const regex = new RegExp(escapeRegExp(query.location || query.search), 'i');
    filter.$or = [
      { name: regex },
      { address_text: regex },
      { district: regex }
    ];
  }

  if (query.districtId || query.district_id) {
    filter.district_id = Number(query.districtId || query.district_id);
  }

  if (query.district || query.districtName) {
    filter.district = new RegExp(`^${escapeRegExp(query.district || query.districtName)}$`, 'i');
  }

  if (query.hotel_type) {
    filter.hotel_type = new RegExp(`^${escapeRegExp(query.hotel_type)}$`, 'i');
  }

  if (query.star_class) {
    filter.star_class = Number(query.star_class);
  }

  if (query.minPrice || query.maxPrice) {
    filter.price_per_night = {};
    if (query.minPrice) {
      filter.price_per_night.$gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      filter.price_per_night.$lte = Number(query.maxPrice);
    }
  }

  if (query.minRating) {
    filter.rating = { $gte: Number(query.minRating) };
  }

  const hotels = await Hotel.find(filter).sort({ rating: -1, createdAt: -1 }).lean();
  return enrichHotelsWithPlaceData(hotels);
};

const getHotelById = async (id) => {
  const hotel = await Hotel.findById(id).lean();
  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }
  const [enriched] = await enrichHotelsWithPlaceData([hotel]);
  return enriched;
};

const updateHotel = async (id, payload) => {
  const hotel = await getHotelDocumentById(id);
  const normalized = await normalizeHotelPayload(payload);
  Object.assign(hotel, normalized);
  await hotel.save();
  return hotel;
};

const deleteHotel = async (id) => {
  const hotel = await getHotelDocumentById(id);
  await hotel.deleteOne();
};

const getHotelDocumentById = async (id) => {
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    throw new AppError('Hotel not found', 404);
  }
  return hotel;
};

const normalizeHotelPayload = async (payload = {}) => {
  const normalized = { ...payload };


  const districtId = normalized.district_id ? Number(normalized.district_id) : null;
  if (districtId) {
    const district = await District.findOne({ district_id: districtId }).select('name').lean();
    if (district?.name) normalized.district = district.name;
  }

  // Check if lat/lng have valid numeric values
  const hasValidLat = normalized.lat !== undefined && normalized.lat !== null
    && normalized.lat !== '' && Number.isFinite(Number(normalized.lat));
  const hasValidLng = normalized.lng !== undefined && normalized.lng !== null
    && normalized.lng !== '' && Number.isFinite(Number(normalized.lng));

  // Ensure lat/lng are stored as numbers when valid
  if (hasValidLat) normalized.lat = Number(normalized.lat);
  if (hasValidLng) normalized.lng = Number(normalized.lng);

  const placeId = normalized.nearby_place_id || normalized.place_id;
  if (placeId) {
    const place = await Place.findOne({ place_id: Number(placeId) }).select('district_id district lat lng address_text').lean();
    if (!normalized.district_id && place?.district_id) normalized.district_id = place.district_id;
    if (!normalized.district && place?.district) normalized.district = place.district;
    // Copy address_text from place if missing
    if (!normalized.address_text && place?.address_text) normalized.address_text = place.address_text;
    
    // Fall back to place coordinates when hotel has no valid lat/lng
    if (!hasValidLat && place?.lat !== undefined) {
      normalized.lat = place.lat;
    }
    if (!hasValidLng && place?.lng !== undefined) {
      normalized.lng = place.lng;
    }
  }



  return normalized;
};

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const enrichHotelsWithPlaceData = async (hotels = []) => {
  const placeIds = [...new Set(
    hotels
      .map((hotel) => hotel.nearby_place_id || hotel.place_id)
      .filter((id) => Number.isFinite(Number(id)))
      .map(Number)
  )];

  if (!placeIds.length) return hotels;

  const places = await Place.find({ place_id: { $in: placeIds } })
    .select('place_id district_id district lat lng')
    .lean();
  const placeMap = new Map(places.map((place) => [Number(place.place_id), place]));

  return hotels.map((hotel) => {
    const placeId = Number(hotel.nearby_place_id || hotel.place_id);
    const place = placeMap.get(placeId);
    if (!place) return hotel;

    return {
      ...hotel,
      district_id: hotel.district_id || place.district_id,
      district: hotel.district || place.district,
      lat: hotel.lat ?? place.lat,
      lng: hotel.lng ?? place.lng,
    };
  });
};

module.exports = {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel
};
