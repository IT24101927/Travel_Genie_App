const express = require('express');

const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const validateRequest = require('../../middleware/validateMiddleware');
const { createUploader } = require('../../middleware/uploadMiddleware');
const { placeValidation, updatePlaceValidation } = require('./place.validation');
const {
  createPlaceHandler,
  getPlacesHandler,
  getPlaceHandler,
  updatePlaceHandler,
  deletePlaceHandler
} = require('./place.controller');

const router = express.Router();
const upload = createUploader('places');

router.get('/', getPlacesHandler);
router.get('/:id', getPlaceHandler);

router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  placeValidation,
  validateRequest,
  createPlaceHandler
);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  updatePlaceValidation,
  validateRequest,
  updatePlaceHandler
);
router.delete('/:id', protect, authorize('admin'), deletePlaceHandler);

module.exports = router;
