const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const { createPlace, getPlaces, getPlaceById, updatePlace, deletePlace } = require('./place.service');
const { normalizePlaceType } = require('./placeTaxonomy');

const toTagArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const normalizePlacePayload = (payload) => {
  const requestedType = payload.type || payload.category;
  const normalizedType = normalizePlaceType(requestedType);
  if (normalizedType) {
    payload.type = normalizedType;
  }
  return payload;
};

const createPlaceHandler = asyncHandler(async (req, res) => {
  const payload = normalizePlacePayload({
    ...req.body,
    tags: toTagArray(req.body.tags)
  });

  if (req.file) {
    payload.image_url = req.file.path.startsWith('http') 
      ? req.file.path 
      : `/uploads/places/${req.file.filename}`;
  }

  const place = await createPlace(req.user.userId, payload);
  return sendSuccess(res, 201, 'Place created successfully', { place });
});

const getPlacesHandler = asyncHandler(async (req, res) => {
  const places = await getPlaces(req.query);
  return sendSuccess(res, 200, 'Places fetched successfully', { places });
});

const getPlaceHandler = asyncHandler(async (req, res) => {
  const place = await getPlaceById(req.params.id);
  return sendSuccess(res, 200, 'Place fetched successfully', { place });
});

const updatePlaceHandler = asyncHandler(async (req, res) => {
  const payload = normalizePlacePayload({ ...req.body });

  if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
    payload.tags = toTagArray(req.body.tags);
  } else {
    delete payload.tags;
  }

  if (req.file) {
    payload.image_url = req.file.path.startsWith('http') 
      ? req.file.path 
      : `/uploads/places/${req.file.filename}`;
  }

  const place = await updatePlace(req.params.id, payload);
  return sendSuccess(res, 200, 'Place updated successfully', { place });
});

const uploadPlaceImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  const imageUrl = req.file.path.startsWith('http') 
    ? req.file.path 
    : `/uploads/places/${req.file.filename}`;
  return sendSuccess(res, 200, 'Image uploaded successfully', { imageUrl });
});

const deletePlaceHandler = asyncHandler(async (req, res) => {
  await deletePlace(req.params.id);
  return sendSuccess(res, 200, 'Place deleted successfully');
});

module.exports = {
  createPlaceHandler,
  getPlacesHandler,
  getPlaceHandler,
  updatePlaceHandler,
  uploadPlaceImageHandler,
  deletePlaceHandler
};
