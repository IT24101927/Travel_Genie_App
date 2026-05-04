const express = require('express');

const { protect } = require('../../../middleware/authMiddleware');
const validateRequest = require('../../../middleware/validateMiddleware');
const { createTripValidation, updateTripValidation } = require('../trip.validation');
const {
  createTripHandler,
  getTripsHandler,
  getTripHandler,
  updateTripHandler,
  deleteTripHandler
} = require('../controllers/trip.controller');


const router = express.Router();

router.use(protect);

router.post('/', createTripValidation, validateRequest, createTripHandler);
router.get('/', getTripsHandler);
router.get('/:id', getTripHandler);
router.put('/:id', updateTripValidation, validateRequest, updateTripHandler);
router.delete('/:id', deleteTripHandler);

module.exports = router;
