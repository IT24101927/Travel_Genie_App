const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: [
        'tuk-tuk', 
        'pickme', 
        'uber', 
        'public-bus', 
        'express-bus', 
        'intercity-train', 
        'private-van', 
        'scooter-rent', 
        'domestic-flight',
        'ferry',
        'taxi',
        'other'
      ],
      required: true
    },
    fromLocation: {
      type: String,
      required: true,
      trim: true
    },
    toLocation: {
      type: String,
      required: true,
      trim: true
    },
    departureDate: {
      type: Date,
      required: true
    },
    arrivalDate: {
      type: Date,
      default: null
    },
    provider: {
      type: String,
      trim: true,
      default: ''
    },
    bookingRef: {
      type: String,
      trim: true,
      default: ''
    },
    seatInfo: {
      type: String,
      trim: true,
      default: ''
    },
    bookingMethod: {
      type: String,
      enum: ['app', 'counter', 'direct', 'website', 'negotiated'],
      default: 'direct'
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0
    },
    actualCost: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'LKR'
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming'
    }
  },
  {
    timestamps: true
  }
);

transportSchema.index({ userId: 1, departureDate: -1 });
transportSchema.index({ tripId: 1, departureDate: 1 });

const Transport = mongoose.model('Transport', transportSchema);

module.exports = Transport;
