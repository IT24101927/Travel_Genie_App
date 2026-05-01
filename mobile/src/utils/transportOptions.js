import colors from '../constants/colors';

export const TRANSPORT_TYPES = [
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
];

export const SCHEDULE_TYPES = [
  'public-bus',
  'express-bus',
  'intercity-train',
  'domestic-flight',
  'ferry',
  'taxi',
  'private-van',
  'other'
];

export const BOOKING_METHODS = ['app', 'counter', 'direct', 'website', 'negotiated'];
export const TRANSPORT_STATUSES = ['upcoming', 'completed', 'cancelled'];

export const BOOKING_CHANNELS = [
  'official-online',
  'authorized-online',
  'mobile-app',
  'counter',
  'onboard-cash',
  'hotline',
  'airport-counter',
  'local-check'
];

export const SERVICE_CLASS_OPTIONS_BY_TYPE = {
  'intercity-train': [
    'Observation Saloon',
    '1st Class AC',
    '1st Class Reserved',
    '2nd Class Reserved',
    '2nd Class',
    '3rd Class Reserved',
    '3rd Class',
    'Unreserved'
  ],
  'express-bus': [
    'Luxury AC',
    'Super Luxury AC',
    'Semi Luxury',
    'Expressway',
    'Standard'
  ],
  'public-bus': [
    'Normal',
    'Semi Luxury',
    'SLTB',
    'Private',
    'Inter-Provincial'
  ],
  'domestic-flight': [
    'Economy',
    'Premium',
    'Charter',
    'Water Aerodrome'
  ],
  ferry: [
    'Standard',
    'Passenger Ferry',
    'Cargo Boat',
    'Private Boat',
    'Navy / RDA Vessel'
  ],
  taxi: [
    'Air Conditioned Taxi',
    'PickMe Tuk',
    'PickMe Flex',
    'PickMe Mini',
    'PickMe Car',
    'PickMe Van',
    'Uber Zip',
    'Uber Premier',
    'Uber Moto',
    'Uber Intercity',
    'Mini',
    'Car',
    'SUV',
    'Van',
    'Airport Counter',
    'Ride Hailing'
  ],
  'private-van': [
    'Shared Van',
    'Private Van',
    'Mini Van',
    'KDH / HiAce',
    'Luxury Van'
  ],
  other: [
    'Standard',
    'Budget',
    'Premium',
    'Private',
    'Shared'
  ]
};

export const TAG_OPTIONS_BY_TYPE = {
  'intercity-train': [
    'railway',
    'reserved',
    'unreserved',
    'scenic',
    'hill-country',
    'coastal',
    'heritage',
    'long-distance',
    'budget',
    'family'
  ],
  'express-bus': [
    'expressway',
    'ac-bus',
    'highway',
    'reserved',
    'terminal',
    'south',
    'airport',
    'fast',
    'family'
  ],
  'public-bus': [
    'local-bus',
    'budget',
    'cash',
    'terminal',
    'direct-bus',
    'inter-provincial',
    'heritage',
    'rural',
    'early-start'
  ],
  'domestic-flight': [
    'domestic-flight',
    'premium',
    'fast',
    'air-taxi',
    'baggage-check',
    'short-stay',
    'scenic-flight'
  ],
  ferry: [
    'ferry',
    'island',
    'local-check',
    'weather-dependent',
    'jetty',
    'passport-check',
    'budget',
    'north'
  ],
  taxi: [
    'taxi',
    'airport',
    'pickme',
    'pickme-intercity',
    'uber',
    'uber-intercity',
    'counter',
    'official-counter',
    'ride-hailing',
    'app-booking',
    'three-wheeler',
    'fixed-fare',
    'tolls',
    'luggage',
    'family'
  ],
  'private-van': [
    'private-transfer',
    'van',
    'shared-van',
    'family',
    'group',
    'luggage',
    'hotel-transfer',
    'scenic',
    'tolls'
  ],
  other: [
    'local',
    'custom',
    'budget',
    'premium',
    'family',
    'group',
    'weather-dependent'
  ]
};

export const TYPE_META = {
  'tuk-tuk': {
    label: 'Tuk Tuk',
    shortLabel: 'Tuk',
    icon: 'bicycle-outline',
    color: '#D4532B'
  },
  pickme: {
    label: 'PickMe',
    shortLabel: 'PickMe',
    icon: 'car-outline',
    color: '#0E7C5F'
  },
  uber: {
    label: 'Uber',
    shortLabel: 'Uber',
    icon: 'car-sport-outline',
    color: '#1A2B23'
  },
  'public-bus': {
    label: 'Public Bus',
    shortLabel: 'Bus',
    icon: 'bus-outline',
    color: '#0E7C5F'
  },
  'express-bus': {
    label: 'Express Bus',
    shortLabel: 'Express',
    icon: 'bus',
    color: '#D4532B'
  },
  'intercity-train': {
    label: 'Intercity Train',
    shortLabel: 'Train',
    icon: 'train-outline',
    color: '#5C4AB8'
  },
  'private-van': {
    label: 'Private Van',
    shortLabel: 'Van',
    icon: 'car-sport-outline',
    color: '#B87D1A'
  },
  'scooter-rent': {
    label: 'Scooter Rent',
    shortLabel: 'Scooter',
    icon: 'bicycle',
    color: '#3498DB'
  },
  'domestic-flight': {
    label: 'Domestic Flight',
    shortLabel: 'Flight',
    icon: 'airplane-outline',
    color: '#1A6EA8'
  },
  ferry: {
    label: 'Ferry',
    shortLabel: 'Ferry',
    icon: 'boat-outline',
    color: '#0A7A60'
  },
  taxi: {
    label: 'Taxi',
    shortLabel: 'Taxi',
    icon: 'car-outline',
    color: '#27AE60'
  },
  other: {
    label: 'Other',
    shortLabel: 'Other',
    icon: 'navigate-outline',
    color: colors.textMuted
  }
};

export const STATUS_META = {
  upcoming: { label: 'Upcoming', color: colors.info, icon: 'time-outline' },
  completed: { label: 'Completed', color: colors.success, icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled', color: colors.danger, icon: 'close-circle-outline' }
};

export const BOOKING_CHANNEL_META = {
  'official-online': {
    label: 'Official online',
    shortLabel: 'Online',
    icon: 'shield-checkmark-outline',
    color: colors.primary
  },
  'authorized-online': {
    label: 'Authorized online',
    shortLabel: 'Online',
    icon: 'card-outline',
    color: colors.info
  },
  'mobile-app': {
    label: 'Mobile app (PickMe / Uber)',
    shortLabel: 'App',
    icon: 'phone-portrait-outline',
    color: '#1A2B23'
  },
  counter: {
    label: 'Counter ticket',
    shortLabel: 'Counter',
    icon: 'storefront-outline',
    color: colors.accent
  },
  'onboard-cash': {
    label: 'Onboard cash',
    shortLabel: 'Cash',
    icon: 'cash-outline',
    color: colors.warning
  },
  hotline: {
    label: 'Call hotline',
    shortLabel: 'Call',
    icon: 'call-outline',
    color: colors.success
  },
  'airport-counter': {
    label: 'Airport counter',
    shortLabel: 'Airport',
    icon: 'airplane-outline',
    color: '#1A6EA8'
  },
  'local-check': {
    label: 'Check locally',
    shortLabel: 'Local',
    icon: 'help-buoy-outline',
    color: colors.textMuted
  }
};

export const getTransportTypeMeta = (type) => TYPE_META[type] || TYPE_META.other;
export const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.upcoming;
export const getBookingChannelMeta = (channel) => BOOKING_CHANNEL_META[channel] || BOOKING_CHANNEL_META['local-check'];
export const getBookingActionLabel = (channel) => {
  if (channel === 'airport-counter') return 'Taxi rates';
  if (channel === 'mobile-app') return 'Open app/site';
  if (['counter', 'onboard-cash', 'local-check'].includes(channel)) return 'Route info';
  return 'Book';
};
export const getServiceClassOptionsForType = (type) => (
  SERVICE_CLASS_OPTIONS_BY_TYPE[type] || SERVICE_CLASS_OPTIONS_BY_TYPE.other
).map((value) => ({ value, label: value }));
export const getTagOptionsForType = (type) => (
  TAG_OPTIONS_BY_TYPE[type] || TAG_OPTIONS_BY_TYPE.other
).map((value) => ({ value, label: value }));

export const transportTypeOptions = TRANSPORT_TYPES.map((value) => ({
  value,
  label: getTransportTypeMeta(value).label
}));

export const scheduleTypeOptions = SCHEDULE_TYPES.map((value) => ({
  value,
  label: getTransportTypeMeta(value).label
}));

export const bookingMethodOptions = BOOKING_METHODS.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1)
}));

export const bookingChannelOptions = BOOKING_CHANNELS.map((value) => ({
  value,
  label: getBookingChannelMeta(value).label
}));

export const statusOptions = TRANSPORT_STATUSES.map((value) => ({
  value,
  label: getStatusMeta(value).label
}));

export const formatDuration = (minutes) => {
  const total = Number(minutes || 0);
  if (!total) return 'Flexible';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatLkr = (amount) => {
  const value = Number(amount || 0);
  return `Rs. ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const scheduleToTransportDraft = (schedule) => ({
  type: schedule?.type || 'public-bus',
  fromLocation: schedule?.departureStation || '',
  toLocation: schedule?.arrivalStation || '',
  provider: schedule?.provider || '',
  seatInfo: schedule?.serviceClass || '',
  bookingMethod: schedule?.bookingUrl ? 'website' : 'direct',
  estimatedCost: schedule?.ticketPriceLKR ? String(schedule.ticketPriceLKR) : '',
  notes: [
    schedule?.routeName ? `Route: ${schedule.routeName}` : '',
    schedule?.routeNo ? `Route No: ${schedule.routeNo}` : '',
    schedule?.departureTime && schedule?.arrivalTime
      ? `Time: ${schedule.departureTime} - ${schedule.arrivalTime}`
      : '',
    schedule?.paymentNotes ? `Booking: ${schedule.paymentNotes}` : '',
    schedule?.bookingTips || ''
  ].filter(Boolean).join('\n')
});
