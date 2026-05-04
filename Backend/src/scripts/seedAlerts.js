const mongoose = require('mongoose');
require('dotenv').config();
const Notification = require('../modules/notifications/models/notification.model');
const User = require('../modules/users/models/user.model');
const Trip = require('../modules/trips/models/trip.model');


const seedAlerts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding alerts...');

    // Find a traveler user
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('No user found to seed alerts for.');
      process.exit(0);
    }

    // Find their trips
    const trips = await Trip.find({ userId: user._id });
    if (trips.length === 0) {
      console.log('No trips found for the user. Please seed trips first.');
      process.exit(0);
    }

    const alerts = [
      {
        userId: user._id,
        tripId: trips[0]._id,
        title: '🚨 Budget Critical Alert',
        message: `Your trip "${trips[0].title}" has exceeded its budget (115% usage). Please review your expenses.`,
        type: 'BUDGET_100',
        status: 'unread',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        userId: user._id,
        tripId: trips[0]._id,
        title: '⚠️ Budget Warning',
        message: `You have reached 85% of your budget for "${trips[0].title}".`,
        type: 'BUDGET_100',
        status: 'read',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ];

    await Notification.insertMany(alerts);
    console.log(`Successfully seeded ${alerts.length} budget alerts for user: ${user.fullName}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding alerts:', error);
    process.exit(1);
  }
};

seedAlerts();
