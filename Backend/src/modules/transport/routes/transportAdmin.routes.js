const express = require('express');
const router = express.Router();
const {
  createTransportSchedule,
  getTransportSchedules,
  getTransportSchedule,
  updateTransportSchedule,
  deleteTransportSchedule
} = require('../controllers/transportAdmin.controller');

const { protect } = require('../../../middleware/authMiddleware');
const { authorize } = require('../../../middleware/roleMiddleware');
const validate = require('../../../middleware/validateMiddleware');
const {
  transportScheduleValidation,
  updateTransportScheduleValidation
} = require('../transport.validation');


// Mount routes - Assuming this router is mounted at /api/v1/admin/transports
// All routes below should be protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .post(transportScheduleValidation, validate, createTransportSchedule)
  .get(getTransportSchedules);

router
  .route('/:id')
  .get(getTransportSchedule)
  .put(updateTransportScheduleValidation, validate, updateTransportSchedule)
  .delete(deleteTransportSchedule);

module.exports = router;
