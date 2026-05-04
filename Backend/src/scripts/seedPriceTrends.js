const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PriceRecord = require('../modules/expenses/models/priceRecord.model');
const Place = require('../modules/places/models/place.model');
const Hotel = require('../modules/hotels/models/hotel.model');


const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // 1. Clear existing price records
    console.log('Cleaning PriceRecord collection...');
    await PriceRecord.deleteMany({});
    console.log('Cleared!');

    // 2. Fetch some sample IDs to link to
    const samplePlace = await Place.findOne().sort({ place_id: 1 });
    const sampleHotel = await Hotel.findOne().sort({ hotel_id: 1 });

    const p_id = samplePlace ? samplePlace.place_id : 1;
    const h_id = sampleHotel ? sampleHotel.hotel_id : 1;

    console.log(`Using base IDs: Place(${p_id}), Hotel(${h_id})`);

    const records = [];
    const now = new Date();
    const currentYear = 2026;

    // Categories and their price ranges (LKR - approx 300 LKR = 1 USD)
    const configs = [
      { type: 'hotel', cat: 'other', min: 25000, max: 75000 },
      { type: 'transport', cat: 'other', min: 5000, max: 15000 },
      { type: 'activity', cat: 'food', min: 1500, max: 6000 },
      { type: 'activity', cat: 'entertainment', min: 3000, max: 20000 },
      { type: 'activity', cat: 'shopping', min: 2000, max: 30000 },
      { type: 'activity', cat: 'amenity', min: 500, max: 3000 }
    ];

    // Seed data for each month of 2026 up to current month (May)
    for (let month = 0; month <= 4; month++) {
      configs.forEach(cfg => {
        // Create 2-3 records per category per month for variety
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const price = cfg.min + Math.random() * (cfg.max - cfg.min);
          const day = 1 + Math.floor(Math.random() * 28);
          
          records.push({
            place_id: cfg.type === 'hotel' ? h_id : p_id,
            item_type: cfg.type,
            category: cfg.cat,
            price: parseFloat(price.toFixed(2)),
            activity_name: cfg.type === 'activity' ? `Sample ${cfg.cat.charAt(0).toUpperCase() + cfg.cat.slice(1)}` : undefined,
            recorded_at: new Date(currentYear, month, day)
          });
        }
      });
    }

    console.log(`Generating ${records.length} records...`);
    await PriceRecord.insertMany(records);
    console.log('Successfully seeded price intelligence data!');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
