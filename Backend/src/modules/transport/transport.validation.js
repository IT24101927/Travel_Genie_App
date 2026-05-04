const { body } = require('express-validator');
const { TRANSPORT_SCHEDULE_TYPES, OPERATING_DAYS, BOOKING_CHANNELS } = require('./models/TransportSchedule');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const transportScheduleValidation = [
  body('type')
    .trim()
    .notEmpty().withMessage('Transport type is required')
    .isIn(TRANSPORT_SCHEDULE_TYPES).withMessage('Invalid transport type'),
  
  body('provider').trim().notEmpty().withMessage('Provider is required'),
  
  body('departureStation').trim().notEmpty().withMessage('Departure station is required'),
  
  body('arrivalStation').trim().notEmpty().withMessage('Arrival station is required'),
  
  body('departureTime')
    .trim()
    .notEmpty().withMessage('Departure time is required')
    .matches(timeRegex).withMessage('Departure time must be in HH:mm format'),
  
  body('arrivalTime')
    .trim()
    .notEmpty().withMessage('Arrival time is required')
    .matches(timeRegex).withMessage('Arrival time must be in HH:mm format'),
  
  body('ticketPriceLKR')
    .notEmpty().withMessage('Ticket price is required')
    .isFloat({ min: 0 }).withMessage('Ticket price must be a positive number'),
  
  body('district_id').optional({ nullable: true }).isInt().withMessage('District ID must be a number'),
  
  body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  
  body('operatingDays').optional().isArray().withMessage('Operating days must be an array'),
  
  body('operatingDays.*').optional().isIn(OPERATING_DAYS).withMessage('Invalid operating day'),
  
  body('bookingChannel').optional().isIn(BOOKING_CHANNELS).withMessage('Invalid booking channel'),
  
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  
  body('popularityScore').optional().isInt({ min: 0, max: 100 }).withMessage('Popularity score must be between 0 and 100'),
  
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const updateTransportScheduleValidation = [
  body('type').optional().trim().isIn(TRANSPORT_SCHEDULE_TYPES).withMessage('Invalid transport type'),
  body('provider').optional().trim().notEmpty().withMessage('Provider cannot be empty'),
  body('departureStation').optional().trim().notEmpty().withMessage('Departure station cannot be empty'),
  body('arrivalStation').optional().trim().notEmpty().withMessage('Arrival station cannot be empty'),
  body('departureTime').optional().trim().matches(timeRegex).withMessage('Departure time must be in HH:mm format'),
  body('arrivalTime').optional().trim().matches(timeRegex).withMessage('Arrival time must be in HH:mm format'),
  body('ticketPriceLKR').optional().isFloat({ min: 0 }).withMessage('Ticket price must be a positive number'),
  body('district_id').optional({ nullable: true }).isInt().withMessage('District ID must be a number'),
  body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  body('operatingDays').optional().isArray().withMessage('Operating days must be an array'),
  body('bookingChannel').optional().isIn(BOOKING_CHANNELS).withMessage('Invalid booking channel'),
  body('popularityScore').optional().isInt({ min: 0, max: 100 }).withMessage('Popularity score must be between 0 and 100'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const transportValidation = [
  body('type').notEmpty().withMessage('Transport type is required'),
  body('fromLocation').trim().notEmpty().withMessage('From location is required'),
  body('toLocation').trim().notEmpty().withMessage('To location is required'),
  body('departureDate').isISO8601().withMessage('Invalid departure date format'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be a positive number'),
  body('actualCost').optional().isFloat({ min: 0 }).withMessage('Actual cost must be a positive number'),
  body('status').optional().isIn(['upcoming', 'completed', 'cancelled']).withMessage('Invalid status')
];

const updateTransportValidation = [
  body('type').optional().notEmpty().withMessage('Transport type cannot be empty'),
  body('fromLocation').optional().trim().notEmpty().withMessage('From location cannot be empty'),
  body('toLocation').optional().trim().notEmpty().withMessage('To location cannot be empty'),
  body('departureDate').optional().isISO8601().withMessage('Invalid departure date format'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be a positive number'),
  body('actualCost').optional().isFloat({ min: 0 }).withMessage('Actual cost must be a positive number'),
  body('status').optional().isIn(['upcoming', 'completed', 'cancelled']).withMessage('Invalid status')
];

module.exports = {
  transportScheduleValidation,
  updateTransportScheduleValidation,
  transportValidation,
  updateTransportValidation
};
