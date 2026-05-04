/*
 * Seeds 3 test user accounts.
 * Usage: node src/scripts/seedTestUsers.js
 *
 * Credentials:
 *   test1@travelgenie.com  /  User@123
 *   test2@travelgenie.com  /  User@123
 *   test3@travelgenie.com  /  User@123
 */
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/db');
const User = require('../modules/users/models/user.model');

const TEST_PASSWORD = 'User@123';

const TEST_USERS = [
  {
    fullName: 'Alice Fernando',
    email: 'test1@travelgenie.com',
    phone: '0771234001',
    travelStyle: 'Adventure',
    interests: ['Mountains', 'Nature', 'Wildlife', 'Adventure'],
    preferences: { currency: 'LKR', preferred_weather: 'Sunny' }
  },
  {
    fullName: 'Bob Perera',
    email: 'test2@travelgenie.com',
    phone: '0771234002',
    travelStyle: 'Culture',
    interests: ['Historical', 'Cultural', 'Religious', 'Art'],
    preferences: { currency: 'USD', preferred_weather: 'Mild' }
  },
  {
    fullName: 'Chamari Silva',
    email: 'test3@travelgenie.com',
    phone: '0771234003',
    travelStyle: 'Relax',
    interests: ['Beaches', 'Relax', 'Photography'],
    preferences: { currency: 'LKR', preferred_weather: 'Any' }
  }
];

const run = async () => {
  try {
    await connectDatabase();

    let created = 0;
    let skipped = 0;

    for (const userData of TEST_USERS) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`Skipped (already exists): ${userData.email}`);
        skipped++;
        continue;
      }

      await User.create({
        ...userData,
        password: TEST_PASSWORD,
        role: 'user',
        isActive: true
      });

      console.log(`Created: ${userData.fullName} <${userData.email}>`);
      created++;
    }

    console.log('========================================');
    console.log(`Done. Created: ${created}, Skipped: ${skipped}`);
    console.log('Password for all test users: User@123');
    console.log('========================================');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
