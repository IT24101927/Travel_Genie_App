const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const { createPlace, getPlaces, getPlaceById, updatePlace, deletePlace } = require('./place.service');

const createPlaceHandler = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : []
  };

  if (req.file) {
    payload.image = `/uploads/places/${req.file.filename}`;
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
  const payload = {
    ...req.body,
    tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : req.body.tags
  };

  if (req.file) {
    payload.image = `/uploads/places/${req.file.filename}`;
  }

  const place = await updatePlace(req.params.id, payload);
  return sendSuccess(res, 200, 'Place updated successfully', { place });
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
  deletePlaceHandler
};
