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
      enum: ['flight', 'bus', 'train', 'car', 'ferry', 'other'],
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
    cost: {
      type: Number,
      default: 0,
      min: 0
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
