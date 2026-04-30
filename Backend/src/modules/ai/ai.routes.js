const express = require('express');

const { protect } = require('../../middleware/authMiddleware');
const { getRecommendationsHandler } = require('./ai.controller');

const router = express.Router();

router.post('/recommendations', protect, getRecommendationsHandler);

module.exports = router;
