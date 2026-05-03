const express = require('express');

const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const validateRequest = require('../../middleware/validateMiddleware');
const { createNotificationValidation } = require('./notification.validation');
const {
  createNotificationHandler,
  getNotificationsHandler,
  markAsReadHandler,
  deleteNotificationHandler
} = require('./notification.controller');

const router = express.Router();

router.use(protect);

router.get('/', getNotificationsHandler);
router.patch('/:id/read', markAsReadHandler);
router.delete('/:id', deleteNotificationHandler);
router.post('/', authorize('admin'), createNotificationValidation, validateRequest, createNotificationHandler);

module.exports = router;
