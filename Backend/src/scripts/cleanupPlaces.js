const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectDatabase } = require('../config/db');
const Place = require('../modules/places/place.model');

async function cleanupPlaces() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB');

    const totalBefore = await Place.countDocuments();
    console.log(`Total places before cleanup: ${totalBefore}`);

    // Identify hotels in places table: empty type AND empty category
    const query = { 
      $and: [
        { type: { $in: ['', null] } },
        { category: { $in: ['', null] } }
      ]
    };

    const duplicateCount = await Place.countDocuments(query);
    console.log(`Found ${duplicateCount} uncategorized entries (hotels) in the places collection.`);

    if (duplicateCount > 0) {
      const result = await Place.deleteMany(query);
      console.log(`Successfully deleted ${result.deletedCount} duplicate entries.`);
    }

    const totalAfter = await Place.countDocuments();
    console.log(`Total places after cleanup: ${totalAfter}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanupPlaces();
