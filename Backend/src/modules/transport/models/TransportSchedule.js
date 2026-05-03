const mongoose = require('mongoose');

const TRANSPORT_SCHEDULE_TYPES = [
  'public-bus',
  'express-bus',
  'intercity-train',
  'domestic-flight',
  'ferry',
  'taxi',
  'private-van',
  'other'
];

const OPERATING_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Daily',
  'Weekdays',
  'Weekends'
];

const BOOKING_CHANNELS = [
  'official-online',
  'authorized-online',
  'mobile-app',
  'counter',
  'onboard-cash',
  'hotline',
  'airport-counter',
  'local-check'
];

const transportScheduleSchema = new mongoose.Schema(
  {
    district_id: {
      type: Number,
      index: true,
      default: null
    },
    district: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    province: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: TRANSPORT_SCHEDULE_TYPES,
      required: [true, 'Transport type is required']
    },
    routeName: {
      type: String,
      trim: true,
      default: ''
    },
    routeNo: {
      type: String,
      trim: true,
      default: ''
    },
    provider: {
      type: String,
      required: [true, 'Provider is required'],
      trim: true
    },
    serviceClass: {
      type: String,
      trim: true,
      default: 'Standard'
    },
    departureStation: {
      type: String,
      required: [true, 'Departure station is required'],
      trim: true
    },
    arrivalStation: {
      type: String,
      required: [true, 'Arrival station is required'],
      trim: true
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      validate: {
        validator: (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
        message: 'Departure time must use HH:mm format'
      }
    },
    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      validate: {
        validator: (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
        message: 'Arrival time must use HH:mm format'
      }
    },
    duration: {
      type: Number,
      default: 0
    },
    ticketPriceLKR: {
      type: Number,
      required: [true, 'Ticket price in LKR is required'],
      min: 0
    },
    operatingDays: {
      type: [String],
      enum: OPERATING_DAYS,
      default: ['Daily']
    },
    contactNumber: {
      type: String,
      trim: true,
      default: ''
    },
    bookingUrl: {
      type: String,
      trim: true,
      default: ''
    },
    bookingChannel: {
      type: String,
      enum: BOOKING_CHANNELS,
      default: 'local-check'
    },
    paymentNotes: {
      type: String,
      trim: true,
      default: ''
    },
    bookingTips: {
      type: String,
      trim: true,
      default: ''
    },
    tags: [{ type: String, trim: true }],
    popularityScore: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes to speed up searching routes
transportScheduleSchema.index({ departureStation: 1, arrivalStation: 1 });
transportScheduleSchema.index({ district_id: 1, type: 1, isActive: 1 });
transportScheduleSchema.index({ type: 1, isActive: 1 });
// Compound index matching the paginated sort order
transportScheduleSchema.index({ popularityScore: -1, district_id: 1, departureTime: 1, createdAt: -1 });
// Text index for search queries
transportScheduleSchema.index({ provider: 'text', routeName: 'text', district: 'text', departureStation: 'text', arrivalStation: 'text' });

const TransportSchedule = mongoose.models.TransportSchedule || mongoose.model('TransportSchedule', transportScheduleSchema);

module.exports = TransportSchedule;
module.exports.TRANSPORT_SCHEDULE_TYPES = TRANSPORT_SCHEDULE_TYPES;
module.exports.OPERATING_DAYS = OPERATING_DAYS;
module.exports.BOOKING_CHANNELS = BOOKING_CHANNELS;
