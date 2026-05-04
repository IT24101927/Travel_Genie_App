const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel
} = require('./hotel.service');

const createHotelHandler = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    amenities: normalizeAmenities(req.body.amenities)
  };

  if (req.file) {
    payload.image_url = req.file.path.startsWith('http') 
      ? req.file.path 
      : `/uploads/hotels/${req.file.filename}`;
  }

  const hotel = await createHotel(req.user.userId, payload);
  return sendSuccess(res, 201, 'Hotel created successfully', { hotel });
});

const getHotelsHandler = asyncHandler(async (req, res) => {
  const hotels = await getHotels(req.query);
  return sendSuccess(res, 200, 'Hotels fetched successfully', { hotels });
});

const getHotelHandler = asyncHandler(async (req, res) => {
  const hotel = await getHotelById(req.params.id);
  return sendSuccess(res, 200, 'Hotel fetched successfully', { hotel });
});

const uploadHotelImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  const imageUrl = req.file.path.startsWith('http') 
    ? req.file.path 
    : `/uploads/hotels/${req.file.filename}`;
  return sendSuccess(res, 200, 'Image uploaded successfully', { imageUrl });
});

const updateHotelHandler = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  if (Object.prototype.hasOwnProperty.call(req.body, 'amenities')) {
    payload.amenities = normalizeAmenities(req.body.amenities);
  }

  if (req.file) {
    payload.image_url = req.file.path.startsWith('http') 
      ? req.file.path 
      : `/uploads/hotels/${req.file.filename}`;
  }

  const hotel = await updateHotel(req.params.id, payload);
  return sendSuccess(res, 200, 'Hotel updated successfully', { hotel });
});

const deleteHotelHandler = asyncHandler(async (req, res) => {
  await deleteHotel(req.params.id);
  return sendSuccess(res, 200, 'Hotel deleted successfully');
});

module.exports = {
  createHotelHandler,
  getHotelsHandler,
  getHotelHandler,
  uploadHotelImageHandler,
  updateHotelHandler,
  deleteHotelHandler
};

function normalizeAmenities(value) {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}
