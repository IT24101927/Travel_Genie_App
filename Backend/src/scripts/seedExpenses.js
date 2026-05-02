const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedExpenses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const Trip = mongoose.model('Trip', new mongoose.Schema({
      title: String,
      budget: Number,
      userId: mongoose.Schema.Types.ObjectId
    }));

    const Expense = mongoose.model('Expense', new mongoose.Schema({
      tripId: mongoose.Schema.Types.ObjectId,
      userId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      currency: String,
      category: String,
      status: String,
      description: String,
      date: Date
    }));

    const PriceRecord = mongoose.model('PriceRecord', new mongoose.Schema({
      place: { place_id: Number, name: String, district: String },
      item_type: String,
      price: Number,
      recorded_at: Date
    }));

    // 1. Clear previous test data
    await Expense.deleteMany({ description: /Platform Seed/ });
    console.log('Cleared old test expenses');

    // 2. Fetch all trips
    const allTrips = await Trip.find();
    console.log(`Found ${allTrips.length} trips to seed.`);

    const categories = ['transport', 'food', 'hotel', 'activity', 'shopping'];
    
    for (const trip of allTrips) {
      const budget = Number(trip.budget) || 100000;
      
      // Determine if this trip should exceed budget (random but ensure at least 2)
      const shouldExceed = Math.random() > 0.6 || trip.title.includes('Beach');
      const totalToSpend = shouldExceed ? budget * 1.15 : budget * 0.6;
      
      console.log(`Seeding "${trip.title}" - Goal: ${shouldExceed ? 'OVER BUDGET' : 'HEALTHY'}`);

      // Distribute spend across categories
      let remainingSpend = totalToSpend;
      for (let i = 0; i < 4; i++) {
        const cat = categories[i % categories.length];
        const amt = i === 3 ? remainingSpend : (remainingSpend * (0.2 + Math.random() * 0.2));
        remainingSpend -= amt;

        if (amt > 0) {
          await Expense.create({
            tripId: trip._id,
            userId: trip.userId,
            amount: Math.round(amt),
            currency: 'LKR',
            category: cat,
            status: Math.random() > 0.3 ? 'paid' : 'planned',
            description: `${cat.toUpperCase()} - Platform Seed`,
            date: new Date()
          });
        }
      }
    }

    // 3. Add Fresh Price Records for major cities
    await PriceRecord.deleteMany({ description: /Platform Seed/ }); // No description in PR model, using place_id markers
    await PriceRecord.create([
      { place: { place_id: 1, name: 'Colombo', district: 'Colombo' }, item_type: 'hotel', price: 140, recorded_at: new Date() },
      { place: { place_id: 2, name: 'Kandy', district: 'Kandy' }, item_type: 'food', price: 12, recorded_at: new Date() },
      { place: { place_id: 3, name: 'Galle', district: 'Galle' }, item_type: 'transport', price: 25, recorded_at: new Date() },
      { place: { place_id: 4, name: 'Nuwara Eliya', district: 'Nuwara Eliya' }, item_type: 'hotel', price: 110, recorded_at: new Date() },
      { place: { place_id: 4, name: 'Nuwara Eliya', district: 'Nuwara Eliya' }, item_type: 'activities', price: 45, recorded_at: new Date() },
      { place: { place_id: 1, name: 'Colombo', district: 'Colombo' }, item_type: 'activities', price: 30, recorded_at: new Date() }
    ]);

    console.log('✅ Comprehensive Seed Completed (Trips + Price Records)');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedExpenses();
