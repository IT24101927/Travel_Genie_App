const express = require('express');

const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const validateRequest = require('../../middleware/validateMiddleware');
const { createUploader } = require('../../middleware/uploadMiddleware');
const { hotelValidation, updateHotelValidation } = require('./hotel.validation');
const {
  createHotelHandler,
  getHotelsHandler,
  getHotelHandler,
  uploadHotelImageHandler,
  updateHotelHandler,
  deleteHotelHandler
} = require('./hotel.controller');

const router = express.Router();
const upload = createUploader('hotels');

router.get('/', getHotelsHandler);
router.get('/:id', getHotelHandler);

router.post('/upload', protect, authorize('admin'), upload.single('image'), uploadHotelImageHandler);

router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  hotelValidation,
  validateRequest,
  createHotelHandler
);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  updateHotelValidation,
  validateRequest,
  updateHotelHandler
);
router.delete('/:id', protect, authorize('admin'), deleteHotelHandler);

module.exports = router;
