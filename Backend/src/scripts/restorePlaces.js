const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectDatabase } = require('../config/db');
const Place = require('../modules/places/place.model');
const Hotel = require('../modules/hotels/hotel.model');

async function restoreHotelPlaces() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB');

    const hotels = await Hotel.find({}).lean();
    console.log(`Found ${hotels.length} hotels. Identifying missing place records...`);

    const existingPlaceIds = new Set(
      (await Place.find({ type: '' }, 'place_id').lean()).map(p => p.place_id)
    );

    const toRestore = [];
    for (const hotel of hotels) {
      if (hotel.place_id && !existingPlaceIds.has(hotel.place_id)) {
        toRestore.push({
          place_id: hotel.place_id,
          district_id: hotel.district_id,
          district: hotel.district,
          name: hotel.name,
          type: '', 
          description: hotel.description,
          address_text: hotel.address_text,
          lat: hotel.lat,
          lng: hotel.lng,
          image_url: hotel.image_url,
          isActive: hotel.isActive,
          rating: hotel.rating,
          review_count: hotel.review_count,
          tags: []
        });
      }
    }

    if (toRestore.length > 0) {
      console.log(`Restoring ${toRestore.length} shadow records in batches...`);
      for (let i = 0; i < toRestore.length; i += 500) {
        const batch = toRestore.slice(i, i + 500);
        await Place.insertMany(batch);
        console.log(`  Restored ${i + batch.length}/${toRestore.length}`);
      }
    } else {
      console.log('No records need restoration.');
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Restoration failed:', err);
    process.exit(1);
  }
}

restoreHotelPlaces();
