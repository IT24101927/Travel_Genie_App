require('dotenv').config();
const mongoose = require('mongoose');

const Hotel = require('../modules/hotels/hotel.model');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/travel_genie';

const checkHotels = async () => {
  await mongoose.connect(DB_URI);

  const [
    total,
    active,
    inactive,
    missingDistrict,
    missingDistrictId,
    missingPrice,
    missingName,
  ] = await Promise.all([
    Hotel.countDocuments(),
    Hotel.countDocuments({ isActive: { $ne: false } }),
    Hotel.countDocuments({ isActive: false }),
    Hotel.countDocuments({ $or: [{ district: '' }, { district: { $exists: false } }] }),
    Hotel.countDocuments({ $or: [{ district_id: null }, { district_id: { $exists: false } }] }),
    Hotel.countDocuments({ $or: [{ price_per_night: null }, { price_per_night: { $exists: false } }] }),
    Hotel.countDocuments({ $or: [{ name: '' }, { name: { $exists: false } }] }),
  ]);

  const districts = await Hotel.aggregate([
    { $group: { _id: { $ifNull: ['$district', 'Other'] }, hotels: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log('Hotel DB check');
  console.log(`Total hotels: ${total}`);
  console.log(`Active hotels: ${active}`);
  console.log(`Inactive hotels: ${inactive}`);
  console.log(`Missing district name: ${missingDistrict}`);
  console.log(`Missing district_id: ${missingDistrictId}`);
  console.log(`Missing price_per_night: ${missingPrice}`);
  console.log(`Missing name: ${missingName}`);
  console.log('District groups:');
  districts.forEach((row) => {
    console.log(`- ${row._id || 'Other'}: ${row.hotels}`);
  });

  await mongoose.disconnect();
};

checkHotels().catch(async (err) => {
  console.error('Hotel DB check failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
