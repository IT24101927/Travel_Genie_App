const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectDatabase } = require('../config/db');

const User = require('../modules/users/user.model');
const Place = require('../modules/places/place.model');
const Hotel = require('../modules/hotels/hotel.model');
const Review = require('../modules/reviews/review.model');

const REVIEW_TITLES = [
  'Amazing Experience!',
  'Had a great time',
  'Decent, but could be better',
  'Absolutely loved it!',
  'Highly recommend',
  'Not worth the hype',
  'Fantastic place for family',
  'Perfect solo trip spot',
  'Great value for money',
  'Memorable stay'
];

const REVIEW_COMMENTS = [
  'The atmosphere was incredible and the staff were very helpful. Will definitely visit again!',
  'Everything was perfect from start to finish. The view was breathtaking.',
  'Good place but the service was a bit slow during peak hours. Otherwise great.',
  'A hidden gem in Sri Lanka. Make sure to visit early in the morning.',
  'The amenities were top-notch and the location is very convenient.',
  'A bit overpriced for what it offers, but still a decent experience.',
  'Great place for kids. They have a nice play area and the food is child-friendly.',
  'I traveled solo and felt very safe and welcomed here. Highly recommended for backpackers.',
  'The room was clean and the breakfast spread was impressive.',
  'One of the best places I have visited in this district. Don’t miss it!'
];

const TRAVEL_TYPES = ['solo', 'couple', 'family', 'friends', 'business'];
const PROS = ['Cleanliness', 'Location', 'Service', 'Value', 'Amenities', 'Food', 'View', 'Quiet', 'Wifi', 'Safety'];
const CONS = ['Price', 'Noise', 'Slow Service', 'Small Room', 'Parking', 'Accessibility', 'Crowded'];

const seedReviews = async () => {
  try {
    await connectDatabase();
    console.log('Connected to database...');

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('Existing reviews cleared.');

    const users = await User.find({ role: 'user' }).limit(5);
    const places = await Place.find({}).limit(10);
    const hotels = await Hotel.find({}).limit(10);

    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      process.exit(1);
    }

    const reviews = [];

    // Create reviews for Places
    for (const place of places) {
      const numReviews = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numReviews; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const rating = Math.floor(Math.random() * 3) + 3; // 3 to 5 stars
        
        reviews.push({
          userId: user._id,
          targetType: 'place',
          targetId: place._id,
          targetName: place.name,
          rating,
          title: REVIEW_TITLES[Math.floor(Math.random() * REVIEW_TITLES.length)],
          comment: REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)],
          travelType: TRAVEL_TYPES[Math.floor(Math.random() * TRAVEL_TYPES.length)],
          visitDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
          wouldRecommend: rating >= 4,
          pros: [PROS[Math.floor(Math.random() * PROS.length)], PROS[Math.floor(Math.random() * PROS.length)]],
          cons: rating < 4 ? [CONS[Math.floor(Math.random() * CONS.length)]] : [],
          status: 'approved',
          helpfulCount: Math.floor(Math.random() * 10),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000))
        });
      }
    }

    // Create reviews for Hotels
    for (const hotel of hotels) {
      const numReviews = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numReviews; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const rating = Math.floor(Math.random() * 4) + 2; // 2 to 5 stars
        
        reviews.push({
          userId: user._id,
          targetType: 'hotel',
          targetId: hotel._id,
          targetName: hotel.name,
          rating,
          title: REVIEW_TITLES[Math.floor(Math.random() * REVIEW_TITLES.length)],
          comment: REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)],
          travelType: TRAVEL_TYPES[Math.floor(Math.random() * TRAVEL_TYPES.length)],
          visitDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
          wouldRecommend: rating >= 4,
          pros: [PROS[Math.floor(Math.random() * PROS.length)], PROS[Math.floor(Math.random() * PROS.length)]],
          cons: rating < 4 ? [CONS[Math.floor(Math.random() * CONS.length)]] : [],
          status: 'approved',
          helpfulCount: Math.floor(Math.random() * 15),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000))
        });
      }
    }

    await Review.insertMany(reviews);
    console.log(`Successfully seeded ${reviews.length} reviews!`);

    // Manually sync ratings since insertMany skips middleware
    const { syncResourceRating } = require('../modules/reviews/review.service');
    console.log('Syncing ratings...');
    
    for (const place of places) {
      await syncResourceRating('place', place._id);
    }
    for (const hotel of hotels) {
      await syncResourceRating('hotel', hotel._id);
    }
    console.log('Ratings synced.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding reviews:', error);
    process.exit(1);
  }
};

seedReviews();
