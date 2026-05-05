const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    budget: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['planned', 'ongoing', 'completed', 'cancelled'],
      default: 'planned'
    },
    districtId: {
      type: Number,
      index: true
    },
    districtName: {
      type: String,
      trim: true,
      default: ''
    },
    province: {
      type: String,
      trim: true,
      default: ''
    },
    selectedPlaces: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    selectedHotel: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    selectedHotels: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    tripType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'group'],
      default: 'couple'
    },
    travelers: {
      type: Number,
      min: 1,
      default: 1
    },
    nights: {
      type: Number,
      min: 1,
      default: 1
    },
    hotelType: {
      type: String,
      trim: true,
      default: 'any'
    },
    currency: {
      type: String,
      trim: true,
      default: 'LKR'
    },
    budgetBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    }
  },
  {
    timestamps: true
  }
);

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
