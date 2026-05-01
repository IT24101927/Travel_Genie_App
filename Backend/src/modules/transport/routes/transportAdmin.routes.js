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

// Mount routes - Assuming this router is mounted at /api/v1/admin/transports
// All routes below should be protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .post(createTransportSchedule)
  .get(getTransportSchedules);

router
  .route('/:id')
  .get(getTransportSchedule)
  .put(updateTransportSchedule)
  .delete(deleteTransportSchedule);

module.exports = router;
