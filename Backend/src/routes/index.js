const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const tripRoutes = require('../modules/trips/trip.routes');
const placeRoutes = require('../modules/places/place.routes');
const districtRoutes = require('../modules/places/district.routes');
const hotelRoutes = require('../modules/hotels/hotel.routes');
const expenseRoutes = require('../modules/expenses/expense.routes');
const reviewRoutes = require('../modules/reviews/review.routes');
const notificationRoutes = require('../modules/notifications/notification.routes');
const transportRoutes = require('../modules/transport/routes/transportRoutes');
const adminRoutes = require('../modules/admin/admin.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'TravelGenie API is healthy',
    data: {
      timestamp: new Date().toISOString()
    }
  });
});

router.get('/version', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'TravelGenie API version',
    data: {
      version: 'v1'
    }
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trips', tripRoutes);
router.use('/places', placeRoutes);
router.use('/districts', districtRoutes);
router.use('/hotels', hotelRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/transport', transportRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
