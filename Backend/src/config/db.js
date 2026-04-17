const mongoose = require('mongoose');
const env = require('./env');

const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is missing. Please set it in .env');
  }

  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected successfully');
};

module.exports = {
  connectDatabase
};
