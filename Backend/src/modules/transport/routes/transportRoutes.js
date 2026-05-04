const express = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const {
  createTransportHandler,
  getTransportsHandler,
  getTransportHandler,
  updateTransportHandler,
  deleteTransportHandler
} = require('../controllers/transportController');
const validate = require('../../../middleware/validateMiddleware');
const {
  transportValidation,
  updateTransportValidation
} = require('../transport.validation');
const {
  getPublicTransportDistricts,
  getPublicTransportSchedules
} = require('../controllers/transportAdmin.controller');


const router = express.Router();

router.get('/schedule-districts', getPublicTransportDistricts);
router.get('/schedules', getPublicTransportSchedules);

router.use(protect);

router.post('/', transportValidation, validate, createTransportHandler);
router.get('/', getTransportsHandler);
router.get('/:id', getTransportHandler);
router.put('/:id', updateTransportValidation, validate, updateTransportHandler);
router.delete('/:id', deleteTransportHandler);


module.exports = router;
