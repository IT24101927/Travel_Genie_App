const mongoose = require('mongoose');
const { connectDatabase } = require('../config/db');
const User = require('../modules/users/user.model');
const Trip = require('../modules/trips/trip.model');
const Place = require('../modules/places/place.model');
const Hotel = require('../modules/hotels/hotel.model');

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const run = async () => {
  try {
    await connectDatabase();

    const users = await User.find({ role: 'user' });
    if (users.length === 0) {
      console.error('No users found! Please run seedTestUsers.js first.');
      process.exit(1);
    }

    // Clear existing trips (optional, but good for clean slate)
    await Trip.deleteMany({});
    console.log('Cleared existing trips.');

    // Get some popular districts
    const db = mongoose.connection.db;
    const districtsCollection = db.collection('districts');
    const districts = await districtsCollection.find({ name: { $in: ['Galle', 'Kandy', 'Nuwara Eliya', 'Colombo', 'Ella'] } }).toArray();

    if (districts.length === 0) {
      console.error('No districts found! Please run seedDestinations.js first.');
      process.exit(1);
    }

    const tripTemplates = [
      { title: 'Romantic Getaway in the Hills', type: 'couple', status: 'planned', duration: 3, budget: 150000 },
      { title: 'Family Beach Vacation', type: 'family', status: 'ongoing', duration: 5, budget: 250000 },
      { title: 'Solo Backpacking Adventure', type: 'solo', status: 'completed', duration: 7, budget: 80000 },
      { title: 'Weekend City Escape', type: 'couple', status: 'planned', duration: 2, budget: 100000 },
      { title: 'Friends Roadtrip', type: 'group', status: 'cancelled', duration: 4, budget: 300000 },
      { title: 'Cultural Heritage Tour', type: 'family', status: 'planned', duration: 6, budget: 180000 },
      { title: 'Surfing Week', type: 'solo', status: 'completed', duration: 5, budget: 120000 },
      { title: 'Luxury Hill Country Retreat', type: 'couple', status: 'planned', duration: 3, budget: 450000 }
    ];

    let created = 0;

    for (let i = 0; i < 15; i++) {
      const user = randomFrom(users);
      const district = randomFrom(districts);
      const template = randomFrom(tripTemplates);
      
      const districtId = Number(district.district_id || district._id);

      // Fetch places and hotels for this district
      const places = await Place.find({ districtId: districtId }).limit(randomInt(2, 5));
      const hotels = await Hotel.find({ districtId: districtId }).limit(5);

      const selectedHotel = hotels.length > 0 ? randomFrom(hotels) : null;
      const hotelCost = selectedHotel ? (Number(selectedHotel.pricePerNight) || 0) * template.duration : 0;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + randomInt(-30, 60)); // Random date between past 30 days and next 60 days
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + template.duration);

      const tripData = {
        userId: user._id,
        title: `${template.title} - ${district.name}`,
        destination: district.name,
        districtId: districtId,
        districtName: district.name,
        province: district.province || 'Unknown',
        startDate,
        endDate,
        budget: template.budget,
        notes: `Automatically generated trip plan for ${district.name}.`,
        status: template.status,
        selectedPlaces: places,
        selectedHotel: selectedHotel,
        tripType: template.type,
        travelers: template.type === 'solo' ? 1 : (template.type === 'couple' ? 2 : randomInt(3, 6)),
        nights: template.duration,
        hotelType: 'any',
        currency: 'LKR',
        budgetBreakdown: {
          hotel: hotelCost,
          food: template.budget * 0.3,
          transport: template.budget * 0.2,
          activities: template.budget * 0.1,
          other: template.budget * 0.1,
          perDay: Math.round(template.budget / template.duration)
        }
      };

      await Trip.create(tripData);
      created++;
    }

    console.log(`Successfully seeded ${created} trips linked to current users.`);

  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
