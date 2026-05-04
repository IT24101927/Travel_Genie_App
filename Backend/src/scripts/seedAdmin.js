/*
 * Seeds one admin account into the database.
 * Usage: node src/scripts/seedAdmin.js
 */
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/db');
const User = require('../modules/users/models/user.model');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@travelgenie.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'TravelGenie Admin';

const run = async () => {
  try {
    await connectDatabase();

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log(`Existing user "${ADMIN_EMAIL}" promoted to admin.`);
      } else {
        console.log(`Admin account "${ADMIN_EMAIL}" already exists. Skipping.`);
      }
    } else {
      const admin = await User.create({
        fullName: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        role: 'admin',
        isActive: true,
        preferences: { currency: 'LKR', preferred_weather: 'Any' }
      });

      console.log('========================================');
      console.log('Admin account created successfully');
      console.log(`Email:    ${admin.email}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
      console.log('========================================');
    }
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
