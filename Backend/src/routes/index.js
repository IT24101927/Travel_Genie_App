const express = require('express');

const authRoutes = require('../modules/auth/routes/auth.routes');

const userRoutes = require('../modules/users/routes/user.routes');

const tripRoutes = require('../modules/trips/routes/trip.routes');
const placeRoutes = require('../modules/places/routes/place.routes');
const districtRoutes = require('../modules/places/routes/district.routes');

const hotelRoutes = require('../modules/hotels/routes/hotel.routes');
const expenseRoutes = require('../modules/expenses/routes/expense.routes');
const reviewRoutes = require('../modules/reviews/routes/review.routes');
const notificationRoutes = require('../modules/notifications/routes/notification.routes');

const transportRoutes = require('../modules/transport/routes/transportRoutes');
const transportAdminRoutes = require('../modules/transport/routes/transportAdmin.routes');
const adminRoutes = require('../modules/admin/routes/admin.routes');


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
router.use('/admin/transports', transportAdminRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
