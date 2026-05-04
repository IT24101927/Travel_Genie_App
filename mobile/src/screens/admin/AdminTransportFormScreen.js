import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppSelect from '../../components/common/AppSelect';
import colors from '../../constants/colors';
import { getDistrictsApi } from '../../api/districtApi';
import {
  adminCreateTransportScheduleApi,
  adminGetTransportScheduleApi,
  adminUpdateTransportScheduleApi
} from '../../api/transportApi';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  bookingChannelOptions,
  formatDuration,
  formatLkr,
  getBookingChannelMeta,
  getServiceClassOptionsForType,
  getTagOptionsForType,
  getTransportTypeMeta,
  scheduleTypeOptions
} from '../../utils/transportOptions';

const RAILWAY_BOOKING_URL = 'https://srilanka-railways.com';
const SLTB_ESEAT_URL = 'https://sltb.eseat.lk/home';
const NTC_BUS_INFO_URL = 'https://www.ntc.gov.lk/Bus_info/time_table.php';
const CINNAMON_AIR_URL = 'https://www.cinnamonair.com/contact-us/';
const AIRPORT_TAXI_URL = 'https://www.airport.lk/passenger_guide/getting_arround/taxi_service.php';
const PICKME_RIDE_URL = 'https://pickme.lk/services/ride/';
const UBER_SRI_LANKA_URL = 'https://www.uber.com/lk/en/';

const DAY_OPTIONS = [
  'Daily',
  'Weekdays',
  'Weekends',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const DISTRICT_COORDS = {
  Colombo: { latitude: 6.9271, longitude: 79.8612 },
  Gampaha: { latitude: 7.0917, longitude: 80.0000 },
  Kalutara: { latitude: 6.5854, longitude: 79.9607 },
  Kandy: { latitude: 7.2906, longitude: 80.6337 },
  Matale: { latitude: 7.4675, longitude: 80.6234 },
  'Nuwara Eliya': { latitude: 6.9497, longitude: 80.7891 },
  Galle: { latitude: 6.0535, longitude: 80.2210 },
  Matara: { latitude: 5.9549, longitude: 80.5550 },
  Hambantota: { latitude: 6.1429, longitude: 81.1212 },
  Jaffna: { latitude: 9.6615, longitude: 80.0255 },
  Kilinochchi: { latitude: 9.3803, longitude: 80.4000 },
  Mannar: { latitude: 8.9810, longitude: 79.9044 },
  Vavuniya: { latitude: 8.7514, longitude: 80.4971 },
  Mullaitivu: { latitude: 9.2671, longitude: 80.8128 },
  Batticaloa: { latitude: 7.7310, longitude: 81.6747 },
  Ampara: { latitude: 7.2910, longitude: 81.6724 },
  Trincomalee: { latitude: 8.5874, longitude: 81.2152 },
  Kurunegala: { latitude: 7.4863, longitude: 80.3647 },
  Puttalam: { latitude: 8.0362, longitude: 79.8283 },
  Anuradhapura: { latitude: 8.3114, longitude: 80.4037 },
  Polonnaruwa: { latitude: 7.9403, longitude: 81.0188 },
  Badulla: { latitude: 6.9934, longitude: 81.0550 },
  Monaragala: { latitude: 6.8728, longitude: 81.3507 },
  Ratnapura: { latitude: 6.6828, longitude: 80.4125 },
  Kegalle: { latitude: 7.2513, longitude: 80.3464 },
  Ella: { latitude: 6.8667, longitude: 81.0466 },
  Sigiriya: { latitude: 7.9570, longitude: 80.7603 },
  'Bandaranaike International Airport': { latitude: 7.1808, longitude: 79.8841 },
  Makumbura: { latitude: 6.8217, longitude: 79.9698 },
  Kadawatha: { latitude: 7.0006, longitude: 79.9583 },
  Pettah: { latitude: 6.9367, longitude: 79.8538 },
  JaEla: { latitude: 7.0767, longitude: 79.8919 },
  Mirigama: { latitude: 7.2411, longitude: 80.1326 },
  Ambepussa: { latitude: 7.2535, longitude: 80.1696 },
  Mawanella: { latitude: 7.2522, longitude: 80.4468 },
  Peradeniya: { latitude: 7.2569, longitude: 80.5953 },
  Avissawella: { latitude: 6.9553, longitude: 80.2044 },
  Hatton: { latitude: 6.8916, longitude: 80.5955 },
  'Nanu Oya': { latitude: 6.9336, longitude: 80.7410 },
  Haputale: { latitude: 6.7681, longitude: 80.9592 },
  Hikkaduwa: { latitude: 6.1395, longitude: 80.1063 },
  Aluthgama: { latitude: 6.4332, longitude: 80.0007 },
  Weligama: { latitude: 5.9739, longitude: 80.4297 },
  Dambulla: { latitude: 7.8731, longitude: 80.6511 },
  Habarana: { latitude: 8.0362, longitude: 80.7482 },
  Galewela: { latitude: 7.7590, longitude: 80.5680 },
  Veyangoda: { latitude: 7.1568, longitude: 80.0954 },
  'Maho Junction': { latitude: 7.8226, longitude: 80.2778 },
  Galoya: { latitude: 8.0925, longitude: 80.9147 },
  Hingurakgoda: { latitude: 8.0369, longitude: 80.9484 },
  Valaichchenai: { latitude: 7.9236, longitude: 81.5311 }
};

const ROUTE_WAYPOINTS = {
  kandy: {
    road: ['Bandaranaike International Airport', 'JaEla', 'Colombo', 'Kadawatha', 'Mirigama', 'Ambepussa', 'Kegalle', 'Mawanella', 'Peradeniya', 'Kandy'],
    rail: ['Colombo', 'Gampaha', 'Veyangoda', 'Ambepussa', 'Kegalle', 'Peradeniya', 'Kandy'],
    air: ['Bandaranaike International Airport', 'JaEla', 'Kadawatha', 'Kegalle', 'Kandy']
  },
  galle: {
    road: ['Bandaranaike International Airport', 'JaEla', 'Colombo', 'Makumbura', 'Kalutara', 'Aluthgama', 'Hikkaduwa', 'Galle'],
    rail: ['Colombo', 'Kalutara', 'Aluthgama', 'Hikkaduwa', 'Galle'],
    air: ['Bandaranaike International Airport', 'JaEla', 'Colombo', 'Makumbura', 'Galle']
  },
  matara: {
    road: ['Bandaranaike International Airport', 'JaEla', 'Colombo', 'Makumbura', 'Kalutara', 'Aluthgama', 'Galle', 'Weligama', 'Matara'],
    rail: ['Colombo', 'Kalutara', 'Aluthgama', 'Galle', 'Weligama', 'Matara']
  },
  badulla: {
    road: ['Colombo', 'Avissawella', 'Ratnapura', 'Haputale', 'Badulla'],
    rail: ['Colombo', 'Gampaha', 'Kandy', 'Nanu Oya', 'Ella', 'Badulla']
  },
  ella: {
    road: ['Colombo', 'Avissawella', 'Ratnapura', 'Haputale', 'Ella'],
    rail: ['Colombo', 'Gampaha', 'Kandy', 'Nanu Oya', 'Haputale', 'Ella']
  },
  anuradhapura: {
    road: ['Colombo', 'Kurunegala', 'Dambulla', 'Anuradhapura'],
    rail: ['Colombo', 'Gampaha', 'Veyangoda', 'Maho Junction', 'Anuradhapura']
  },
  polonnaruwa: {
    road: ['Colombo', 'Kurunegala', 'Dambulla', 'Habarana', 'Polonnaruwa'],
    rail: ['Colombo', 'Gampaha', 'Maho Junction', 'Galoya', 'Hingurakgoda', 'Polonnaruwa']
  },
  trincomalee: {
    road: ['Colombo', 'Kurunegala', 'Dambulla', 'Habarana', 'Trincomalee'],
    rail: ['Colombo', 'Gampaha', 'Maho Junction', 'Galoya', 'Trincomalee']
  },
  batticaloa: {
    road: ['Colombo', 'Kurunegala', 'Dambulla', 'Polonnaruwa', 'Valaichchenai', 'Batticaloa'],
    rail: ['Colombo', 'Gampaha', 'Maho Junction', 'Galoya', 'Polonnaruwa', 'Valaichchenai', 'Batticaloa']
  },
  jaffna: {
    road: ['Colombo', 'Kurunegala', 'Anuradhapura', 'Vavuniya', 'Kilinochchi', 'Jaffna'],
    rail: ['Colombo', 'Gampaha', 'Kurunegala', 'Anuradhapura', 'Vavuniya', 'Kilinochchi', 'Jaffna']
  },
  sigiriya: {
    road: ['Colombo', 'Kurunegala', 'Dambulla', 'Sigiriya'],
    air: ['Bandaranaike International Airport', 'Sigiriya']
  },
  nuwaraEliya: {
    road: ['Colombo', 'Kegalle', 'Kandy', 'Nuwara Eliya'],
    rail: ['Colombo', 'Kandy', 'Nanu Oya', 'Nuwara Eliya']
  }
};

const SRI_LANKA_REGION = {
  latitude: 7.85,
  longitude: 80.65,
  latitudeDelta: 8,
  longitudeDelta: 5
};

const defaultForm = {
  district_id: '',
  district: '',
  province: '',
  type: '',
  routeName: '',
  routeNo: '',
  provider: '',
  serviceClass: '',
  departureStation: '',
  arrivalStation: '',
  departureTime: '',
  arrivalTime: '',
  duration: '',
  ticketPriceLKR: '',
  operatingDays: ['Daily'],
  contactNumber: '',
  bookingUrl: '',
  bookingChannel: 'local-check',
  paymentNotes: '',
  bookingTips: '',
  tagsText: '',
  popularityScore: '50',
  isActive: true
};

const TYPE_PRESETS = {
  'intercity-train': {
    provider: 'Sri Lanka Railways',
    serviceClass: '2nd Class Reserved',
    bookingUrl: RAILWAY_BOOKING_URL,
    bookingChannel: 'official-online',
    contactNumber: '1919',
    paymentNotes: 'Use srilanka-railways.com for reserved seats. Ask travelers to carry the booking proof plus NIC or passport.',
    bookingTips: 'Reserved seats are best for Colombo to Kandy, Ella, Badulla, Jaffna and Batticaloa routes.',
    tagsText: 'railway, reserved, scenic',
    popularityScore: '90'
  },
  'express-bus': {
    provider: 'SLTB Highway Bus',
    serviceClass: 'Luxury AC',
    bookingUrl: 'https://sltb.eseat.lk/home',
    bookingChannel: 'authorized-online',
    contactNumber: '1315',
    paymentNotes: 'Check SLTB eSeat for reservable CTB buses. If the route is not listed, use terminal counter tickets.',
    bookingTips: 'Use Makumbura, Kadawatha or major highway terminals for expressway departures.',
    tagsText: 'expressway, ac-bus, highway',
    popularityScore: '80'
  },
  'public-bus': {
    provider: 'SLTB / Private Route Bus',
    serviceClass: 'Normal',
    bookingUrl: 'https://www.ntc.gov.lk/Bus_info/time_table.php',
    bookingChannel: 'onboard-cash',
    contactNumber: '1315',
    paymentNotes: 'Most normal buses are paid at the terminal or onboard in cash. Keep smaller notes ready.',
    bookingTips: 'Tell travelers to confirm the route number and final stop with the conductor.',
    tagsText: 'budget, local-bus, cash',
    popularityScore: '65'
  },
  'domestic-flight': {
    provider: 'Cinnamon Air',
    serviceClass: 'Economy',
    bookingUrl: 'https://www.cinnamonair.com/contact-us/',
    bookingChannel: 'official-online',
    contactNumber: '+94112475475',
    paymentNotes: 'Use the operator booking/contact channel and confirm baggage allowance before payment.',
    bookingTips: 'Best for premium short itineraries to Sigiriya, Koggala, Trincomalee or Castlereagh.',
    tagsText: 'domestic-flight, premium, fast',
    popularityScore: '60'
  },
  ferry: {
    provider: 'Local Ferry Service',
    serviceClass: 'Standard',
    bookingUrl: '',
    bookingChannel: 'local-check',
    contactNumber: '',
    paymentNotes: 'Ferry schedules can change with weather, capacity and local operations. Confirm locally before travel.',
    bookingTips: 'Ask travelers to check at the jetty, bus stand or hotel before leaving for the pier.',
    tagsText: 'ferry, island, local-check',
    popularityScore: '55'
  },
  taxi: {
    provider: 'Airport and Aviation Services Taxi Counter',
    serviceClass: 'Air Conditioned Taxi',
    bookingUrl: 'https://www.airport.lk/passenger_guide/getting_arround/taxi_service.php',
    bookingChannel: 'airport-counter',
    contactNumber: '+94112263096',
    paymentNotes: 'Confirm counter fare, extra kilometer charge and extra drop charge before leaving the airport.',
    bookingTips: 'Good for airport arrivals when app pickup is difficult or the traveler wants a counter receipt.',
    tagsText: 'airport, taxi, counter',
    popularityScore: '70'
  },
  'private-van': {
    provider: 'Private Transfer Operator',
    serviceClass: 'Private Van',
    bookingUrl: '',
    bookingChannel: 'hotline',
    contactNumber: '+94771234567',
    paymentNotes: 'Confirm by call or WhatsApp. Agree pickup point, luggage space, tolls and payment method.',
    bookingTips: 'Useful for family groups, hill-country routes and hotel-to-hotel transfers.',
    tagsText: 'private-transfer, van, family',
    popularityScore: '68'
  },
  other: {
    provider: '',
    serviceClass: 'Standard',
    bookingUrl: '',
    bookingChannel: 'local-check',
    contactNumber: '',
    paymentNotes: 'Confirm booking, fare and availability locally before showing this route to users.',
    bookingTips: 'Add clear local instructions for travelers.',
    tagsText: 'local, custom',
    popularityScore: '40'
  }
};

const TYPE_COPY = {
  'intercity-train': {
    title: 'Railway Schedule',
    description: 'Train routes need station names, train number, class and reservation guidance.',
    routeNameLabel: 'Train Name',
    routeNamePlaceholder: 'Podi Menike, Ella Odyssey, Yal Devi',
    routeNoLabel: 'Train Number',
    routeNoPlaceholder: '1005',
    providerLabel: 'Railway Operator *',
    classLabel: 'Seat Class',
    departureLabel: 'Departure Station *',
    departurePlaceholder: 'Colombo Fort Railway Station',
    arrivalLabel: 'Arrival Station *',
    arrivalPlaceholder: 'Kandy Railway Station',
    priceLabel: 'Ticket Price LKR *'
  },
  'express-bus': {
    title: 'Highway Bus Schedule',
    description: 'Express buses need terminal names, route numbers, class and booking/counter instructions.',
    routeNameLabel: 'Route Name',
    routeNamePlaceholder: 'Southern Expressway, Kadawatha to Matara',
    routeNoLabel: 'Route Number',
    routeNoPlaceholder: 'EX001',
    providerLabel: 'Bus Operator *',
    classLabel: 'Bus Class',
    departureLabel: 'Departure Terminal *',
    departurePlaceholder: 'Makumbura Multimodal Centre',
    arrivalLabel: 'Arrival Terminal *',
    arrivalPlaceholder: 'Galle Central Bus Stand',
    priceLabel: 'Ticket Price LKR *'
  },
  'public-bus': {
    title: 'Local Bus Schedule',
    description: 'Normal route buses should highlight route number, stand, cash payment and conductor confirmation.',
    routeNameLabel: 'Route Name',
    routeNamePlaceholder: 'Pettah to Anuradhapura',
    routeNoLabel: 'Route Number',
    routeNoPlaceholder: '15, 48, 99',
    providerLabel: 'Operator *',
    classLabel: 'Bus Class',
    departureLabel: 'Departure Bus Stand *',
    departurePlaceholder: 'Colombo Central Bus Stand - Pettah',
    arrivalLabel: 'Arrival Bus Stand *',
    arrivalPlaceholder: 'Anuradhapura New Bus Stand',
    priceLabel: 'Approx Fare LKR *'
  },
  'domestic-flight': {
    title: 'Domestic Flight',
    description: 'Domestic flights need airport/water aerodrome names, operator contact and baggage guidance.',
    routeNameLabel: 'Flight Route Name',
    routeNamePlaceholder: 'BIA to Koggala Air Taxi',
    routeNoLabel: 'Flight / Service Code',
    routeNoPlaceholder: 'CIN-GLE',
    providerLabel: 'Air Operator *',
    classLabel: 'Cabin Class',
    departureLabel: 'Departure Airport *',
    departurePlaceholder: 'Bandaranaike International Airport',
    arrivalLabel: 'Arrival Airport / Water Aerodrome *',
    arrivalPlaceholder: 'Koggala Airport',
    priceLabel: 'Fare LKR *'
  },
  ferry: {
    title: 'Ferry Route',
    description: 'Island ferries need jetty names and strong local-check notes for weather and capacity.',
    routeNameLabel: 'Ferry Route',
    routeNamePlaceholder: 'Kurikadduwan to Delft Island',
    routeNoLabel: 'Vessel / Route Code',
    routeNoPlaceholder: 'KKD-DLF',
    providerLabel: 'Ferry Operator *',
    classLabel: 'Service Type',
    departureLabel: 'Departure Jetty *',
    departurePlaceholder: 'Kurikadduwan Jetty',
    arrivalLabel: 'Arrival Jetty *',
    arrivalPlaceholder: 'Delft Island Jetty',
    priceLabel: 'Fare LKR *'
  },
  taxi: {
    title: 'Taxi / Airport Transfer',
    description: 'Taxi routes cover PickMe, Uber, airport counters and local cabs with pickup/drop and toll notes.',
    routeNameLabel: 'Transfer Name',
    routeNamePlaceholder: 'BIA Airport Taxi Counter to Colombo',
    routeNoLabel: 'Route / Desk Code',
    routeNoPlaceholder: 'AASL-CMB',
    providerLabel: 'Taxi Provider *',
    classLabel: 'Vehicle Class',
    departureLabel: 'Pickup Point *',
    departurePlaceholder: 'Bandaranaike International Airport Arrival Lobby',
    arrivalLabel: 'Drop-off Area *',
    arrivalPlaceholder: 'Colombo City',
    priceLabel: 'Estimated Fare LKR *'
  },
  'private-van': {
    title: 'Private Van Transfer',
    description: 'Van routes need operator contact, pickup/drop points, luggage and toll instructions.',
    routeNameLabel: 'Transfer Name',
    routeNamePlaceholder: 'Kandy to Nuwara Eliya Scenic Van',
    routeNoLabel: 'Service Code',
    routeNoPlaceholder: 'KDY-NE',
    providerLabel: 'Transfer Operator *',
    classLabel: 'Vehicle Type',
    departureLabel: 'Pickup Point *',
    departurePlaceholder: 'Kandy Clock Tower',
    arrivalLabel: 'Drop-off Point *',
    arrivalPlaceholder: 'Nuwara Eliya Post Office',
    priceLabel: 'Estimated Fare LKR *'
  },
  other: {
    title: 'Custom Transport',
    description: 'Use this for special local services that do not fit a standard mode.',
    routeNameLabel: 'Route Name',
    routeNamePlaceholder: 'Custom route',
    routeNoLabel: 'Route Code',
    routeNoPlaceholder: 'LOCAL-01',
    providerLabel: 'Provider *',
    classLabel: 'Service Class',
    departureLabel: 'Departure Point *',
    departurePlaceholder: 'Starting point',
    arrivalLabel: 'Arrival Point *',
    arrivalPlaceholder: 'Destination point',
    priceLabel: 'Fare LKR *'
  }
};

const normalizeScheduleToForm = (schedule) => ({
  ...defaultForm,
  ...schedule,
  district_id: schedule?.district_id ? String(schedule.district_id) : '',
  duration: schedule?.duration ? String(schedule.duration) : '',
  ticketPriceLKR: schedule?.ticketPriceLKR ? String(schedule.ticketPriceLKR) : '',
  operatingDays: Array.isArray(schedule?.operatingDays) && schedule.operatingDays.length
    ? schedule.operatingDays
    : ['Daily'],
  tagsText: Array.isArray(schedule?.tags) ? schedule.tags.join(', ') : '',
  popularityScore: schedule?.popularityScore !== undefined ? String(schedule.popularityScore) : '50',
  isActive: schedule?.isActive !== false
});

const getCopy = (type) => TYPE_COPY[type] || TYPE_COPY.other;
const getPreset = (type) => TYPE_PRESETS[type] || TYPE_PRESETS.other;
const isValidTime = (value) => /^([0-1]?\d|2[0-3])[:.][0-5]\d$/.test(String(value || '').trim());
const normalizeTime = (val) => {
  const s = String(val || '').trim().replace('.', ':');
  const [hh, mm] = s.split(':');
  return `${hh.padStart(2, '0')}:${mm}`;
};

const parseTagsText = (value) => String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean);
const isBusType = (type) => ['public-bus', 'express-bus'].includes(type);

const getDefaultBookingUrl = (type, channel, form = {}) => {
  const text = [
    form.provider,
    form.serviceClass,
    form.routeName,
    form.tagsText
  ].join(' ').toLowerCase();

  if (channel === 'official-online') {
    if (type === 'intercity-train') return RAILWAY_BOOKING_URL;
    if (type === 'domestic-flight') return CINNAMON_AIR_URL;
    return '';
  }

  if (channel === 'authorized-online') {
    return isBusType(type) ? SLTB_ESEAT_URL : '';
  }

  if (channel === 'mobile-app') {
    if (text.includes('uber')) return UBER_SRI_LANKA_URL;
    if (text.includes('pickme')) return PICKME_RIDE_URL;
    return type === 'taxi' ? PICKME_RIDE_URL : '';
  }

  if (channel === 'airport-counter') return AIRPORT_TAXI_URL;
  if (['counter', 'onboard-cash'].includes(channel)) return isBusType(type) ? NTC_BUS_INFO_URL : '';
  return '';
};

const findLocationCoordinate = (value, fallbackName = '') => {
  const text = `${value || ''} ${fallbackName || ''}`.toLowerCase();
  if (!text.trim()) return null;

  const aliases = [
    ['Bandaranaike International Airport', ['bandaranaike', 'bia', 'airport', 'katunayake']],
    ['Colombo', ['colombo fort', 'fort railway', 'colombo central', 'colombo city', 'colombo']],
    ['Pettah', ['pettah']],
    ['Makumbura', ['makumbura']],
    ['Kadawatha', ['kadawatha']],
    ['Nuwara Eliya', ['nanu oya', 'nuwara eliya']],
    ['Galle', ['galle fort', 'galle']],
    ['Ella', ['ella']],
    ['Sigiriya', ['sigiriya']]
  ];

  const alias = aliases.find(([, terms]) => terms.some((term) => text.includes(term)));
  if (alias) return DISTRICT_COORDS[alias[0]];

  const districtName = Object.keys(DISTRICT_COORDS).find((name) => text.includes(name.toLowerCase()));
  return districtName ? DISTRICT_COORDS[districtName] : null;
};

const getRouteRegion = (...routePoints) => {
  const points = routePoints.flat().filter(Boolean);
  if (!points.length) return SRI_LANKA_REGION;
  if (points.length === 1) {
    return { ...points[0], latitudeDelta: 1.1, longitudeDelta: 1.1 };
  }

  const minLat = Math.min(...points.map((point) => point.latitude));
  const maxLat = Math.max(...points.map((point) => point.latitude));
  const minLng = Math.min(...points.map((point) => point.longitude));
  const maxLng = Math.max(...points.map((point) => point.longitude));

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.8),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.8)
  };
};

const getRouteMode = (type) => {
  if (type === 'intercity-train') return 'rail';
  if (type === 'domestic-flight') return 'air';
  return 'road';
};

const getRouteKey = (form = {}) => {
  const text = [
    form.district,
    form.arrivalStation,
    form.routeName,
    form.departureStation
  ].join(' ').toLowerCase();

  const checks = [
    ['nuwaraEliya', ['nuwara eliya', 'nanu oya']],
    ['anuradhapura', ['anuradhapura']],
    ['polonnaruwa', ['polonnaruwa']],
    ['trincomalee', ['trincomalee']],
    ['batticaloa', ['batticaloa', 'pasikudah']],
    ['sigiriya', ['sigiriya']],
    ['badulla', ['badulla']],
    ['jaffna', ['jaffna']],
    ['matara', ['matara', 'weligama', 'mirissa']],
    ['galle', ['galle']],
    ['ella', ['ella']],
    ['kandy', ['kandy']]
  ];

  const match = checks.find(([, terms]) => terms.some((term) => text.includes(term)));
  return match?.[0] || null;
};

const getDistanceScore = (a, b) => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.abs(a.latitude - b.latitude) + Math.abs(a.longitude - b.longitude);
};

const getNearestIndex = (points, target) => {
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const score = getDistanceScore(point, target);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
};

const buildRoutePath = (form, start, end) => {
  if (!start || !end) return [start, end].filter(Boolean);

  const key = getRouteKey(form);
  const mode = getRouteMode(form.type);
  const waypointNames = key ? (ROUTE_WAYPOINTS[key]?.[mode] || ROUTE_WAYPOINTS[key]?.road) : null;
  const waypoints = waypointNames
    ?.map((name) => DISTRICT_COORDS[name])
    .filter(Boolean);

  if (!waypoints?.length) return [start, end];

  const startIndex = getNearestIndex(waypoints, start);
  const endIndex = getNearestIndex(waypoints, end);
  const corridor = startIndex <= endIndex
    ? waypoints.slice(startIndex, endIndex + 1)
    : waypoints.slice(endIndex, startIndex + 1).reverse();

  const path = corridor.length ? [...corridor] : [...waypoints];
  path[0] = start;
  path[path.length - 1] = end;
  return path;
};

const DayChip = ({ day, active, onPress }) => (
  <Pressable style={[styles.dayChip, active && styles.dayChipActive]} onPress={onPress}>
    <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day}</Text>
  </Pressable>
);

const GuidanceField = ({ label, icon, value, onChangeText, placeholder }) => (
  <View style={styles.guidanceField}>
    <View style={styles.guidanceLabelRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.guidanceLabel}>{label}</Text>
    </View>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline
      textAlignVertical="top"
      style={styles.guidanceInput}
    />
  </View>
);

const ROAD_TYPES = new Set(['public-bus', 'express-bus', 'taxi', 'private-van', 'ferry', 'other']);

const fetchOsrmRoute = async (start, end) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const json = await res.json();
  const coords = json?.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) throw new Error('No coords');
  return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
};

const RouteMapPreview = ({ routePreview, color, transportType }) => {
  const { start, end, path: fallbackPath, startLabel, endLabel } = routePreview;
  const hasRoute = start && end;

  const [apiPath, setApiPath] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeSource, setRouteSource] = useState('fallback');

  useEffect(() => {
    if (!hasRoute) { setApiPath(null); setRouteSource('fallback'); return; }
    const isRoad = ROAD_TYPES.has(transportType);
    if (!isRoad) { setApiPath(null); setRouteSource('fallback'); return; }

    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      setLoadingRoute(true);
      try {
        const coords = await fetchOsrmRoute(start, end);
        if (!cancelled) { setApiPath(coords); setRouteSource('live'); }
      } catch (err) {
        console.warn('[OSRM]', err?.message);
        if (!cancelled) { setApiPath(null); setRouteSource('fallback'); }
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    }, 800);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [start?.latitude, start?.longitude, end?.latitude, end?.longitude, transportType, hasRoute]);

  const activePath = apiPath || fallbackPath;
  const hasShape = hasRoute && activePath.length > 2;
  const region = getRouteRegion(...activePath);

  const badgeLabel = loadingRoute
    ? 'Fetching route…'
    : routeSource === 'live'
      ? 'Live road route'
      : hasShape ? 'Route shape' : hasRoute ? 'Approx path' : 'Needs points';

  return (
    <View style={styles.mapPreviewCard}>
      <View style={styles.mapPreviewHeader}>
        <View style={styles.mapPreviewTitleRow}>
          <Ionicons name="map-outline" size={17} color={color} />
          <Text style={styles.mapPreviewTitle}>Route Preview</Text>
        </View>
        <View style={styles.mapPreviewBadgeRow}>
          {loadingRoute ? <ActivityIndicator size={11} color={color} style={{ marginRight: 4 }} /> : null}
          <Text style={[styles.mapPreviewBadge, routeSource === 'live' && { color }]}>{badgeLabel}</Text>
        </View>
      </View>

      {start || end ? (
        <View style={styles.mapFrame}>
          <MapView
            style={styles.routeMap}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {start ? (
              <Marker coordinate={start} title={startLabel || 'Departure'} pinColor={colors.primaryDark} />
            ) : null}
            {end ? (
              <Marker coordinate={end} title={endLabel || 'Arrival'} pinColor={color} />
            ) : null}
            {hasRoute ? (
              <Polyline
                coordinates={activePath}
                strokeColor={color}
                strokeWidth={4}
                lineDashPattern={transportType === 'domestic-flight' ? [6, 4] : hasShape ? undefined : [1]}
              />
            ) : null}
          </MapView>
        </View>
      ) : (
        <View style={styles.mapEmptyState}>
          <Ionicons name="trail-sign-outline" size={24} color={colors.textMuted} />
          <Text style={styles.mapEmptyTitle}>Add route points to preview</Text>
          <Text style={styles.mapEmptySub}>Use known Sri Lankan city, station, airport, terminal or district names.</Text>
        </View>
      )}

      <View style={styles.mapLegendRow}>
        <View style={styles.mapLegendItem}>
          <View style={[styles.mapLegendDot, { backgroundColor: colors.primaryDark }]} />
          <Text style={styles.mapLegendText} numberOfLines={1}>{startLabel || 'Departure point'}</Text>
        </View>
        <View style={styles.mapLegendItem}>
          <View style={[styles.mapLegendDot, { backgroundColor: color }]} />
          <Text style={styles.mapLegendText} numberOfLines={1}>{endLabel || 'Arrival / district'}</Text>
        </View>
      </View>
      <Text style={styles.mapPreviewNote}>
        {routeSource === 'live'
          ? 'Road route from OSRM. Follows actual road network.'
          : transportType === 'intercity-train'
            ? 'Uses Sri Lanka rail corridor waypoints.'
            : transportType === 'domestic-flight'
              ? 'Straight-line flight path between airports.'
              : 'Approximate path. Enter departure and arrival to load live road route.'}
      </Text>
    </View>
  );
};

const StepPill = ({ number, label, active }) => (
  <View style={[styles.stepPill, active && styles.stepPillActive]}>
    <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{number}</Text>
    <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
  </View>
);

const TypeCard = ({ type, selected, onPress }) => {
  const meta = getTransportTypeMeta(type);
  const copy = getCopy(type);

  return (
    <Pressable
      style={[styles.typeCard, selected && { borderColor: meta.color, backgroundColor: `${meta.color}10` }]}
      onPress={onPress}
    >
      <View style={[styles.typeIcon, { backgroundColor: `${meta.color}18` }]}>
        <Ionicons name={meta.icon} size={24} color={meta.color} />
      </View>
      <View style={styles.typeCardBody}>
        <Text style={styles.typeName}>{meta.label}</Text>
        <Text style={styles.typeDescription} numberOfLines={2}>{copy.description}</Text>
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'chevron-forward'} size={22} color={selected ? meta.color : colors.textMuted} />
    </Pressable>
  );
};

const AdminTransportFormScreen = ({ navigation, route }) => {
  const transportId = route.params?.transportId;
  const isEditing = !!transportId;
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState(defaultForm);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [typeConfirmed, setTypeConfirmed] = useState(isEditing);

  const typeMeta = useMemo(() => getTransportTypeMeta(form.type || 'other'), [form.type]);
  const typeCopy = useMemo(() => getCopy(form.type || 'other'), [form.type]);
  const bookingMeta = useMemo(() => getBookingChannelMeta(form.bookingChannel), [form.bookingChannel]);
  const serviceClassOptions = useMemo(() => getServiceClassOptionsForType(form.type || 'other'), [form.type]);
  const tagOptions = useMemo(() => getTagOptionsForType(form.type || 'other'), [form.type]);
  const selectedTags = useMemo(() => parseTagsText(form.tagsText), [form.tagsText]);
  const addableTagOptions = useMemo(
    () => tagOptions.filter((option) => !selectedTags.includes(option.value)),
    [selectedTags, tagOptions]
  );
  const districtOptions = useMemo(() => districts.map((district) => ({
    value: String(district.district_id),
    label: `${district.name} - ${district.province}`
  })), [districts]);
  const routePreview = useMemo(() => {
    const start = findLocationCoordinate(form.departureStation);
    const end = findLocationCoordinate(form.arrivalStation, form.district);
    const path = buildRoutePath(form, start, end);
    return {
      start,
      end,
      path,
      startLabel: form.departureStation.trim(),
      endLabel: form.arrivalStation.trim() || form.district,
      region: getRouteRegion(...path)
    };
  }, [form]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const districtPromise = getDistrictsApi();
        const schedulePromise = isEditing ? adminGetTransportScheduleApi(transportId) : Promise.resolve(null);
        const [districtRes, scheduleRes] = await Promise.all([districtPromise, schedulePromise]);
        if (!isMounted) return;
        setDistricts(districtRes?.data || []);

        if (scheduleRes) {
          const schedule = scheduleRes?.data?.schedule || scheduleRes?.data || {};
          setForm(normalizeScheduleToForm(schedule));
          setTypeConfirmed(true);
        }
      } catch (err) {
        Alert.alert('Error', getApiErrorMessage(err, 'Failed to load transport form.'));
        navigation.goBack();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [isEditing, navigation, transportId]);

  const handleChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleBookingChannelChange = (channel) => {
    setForm((prev) => ({
      ...prev,
      bookingChannel: channel,
      bookingUrl: getDefaultBookingUrl(prev.type, channel, prev)
    }));
  };

  const handleServiceClassChange = (serviceClass) => {
    setForm((prev) => {
      const next = { ...prev, serviceClass };
      if (prev.bookingChannel === 'mobile-app') {
        next.bookingUrl = getDefaultBookingUrl(prev.type, prev.bookingChannel, next);
      }
      return next;
    });
  };

  const handleAddTag = (tag) => {
    setForm((prev) => {
      const tags = parseTagsText(prev.tagsText);
      if (tags.includes(tag)) return prev;
      return { ...prev, tagsText: [...tags, tag].join(', ') };
    });
  };

  const handleRemoveTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tagsText: parseTagsText(prev.tagsText).filter((item) => item !== tag).join(', ')
    }));
  };

  const handleTypeSelect = (type) => {
    const preset = getPreset(type);
    setForm((prev) => ({
      ...prev,
      type,
      provider: preset.provider,
      serviceClass: preset.serviceClass,
      bookingUrl: preset.bookingUrl,
      bookingChannel: preset.bookingChannel,
      contactNumber: preset.contactNumber,
      paymentNotes: preset.paymentNotes,
      bookingTips: preset.bookingTips,
      tagsText: preset.tagsText,
      popularityScore: preset.popularityScore
    }));
    setTypeConfirmed(true);
  };

  const handleDistrictChange = (districtId) => {
    const district = districts.find((item) => String(item.district_id) === String(districtId));
    setForm((prev) => ({
      ...prev,
      district_id: districtId,
      district: district?.name || '',
      province: district?.province || ''
    }));
  };

  const handleArrivalChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, arrivalStation: value };
      if (!value.trim()) return next;
      const text = value.toLowerCase();
      const match = districts.find((d) => text.includes(d.name.toLowerCase()));
      if (match) {
        next.district_id = String(match.district_id);
        next.district = match.name;
        next.province = match.province || '';
      }
      return next;
    });
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      if (day === 'Daily') {
        return { ...prev, operatingDays: ['Daily'] };
      }

      const withoutDaily = prev.operatingDays.filter((item) => item !== 'Daily');
      const next = withoutDaily.includes(day)
        ? withoutDaily.filter((item) => item !== day)
        : [...withoutDaily, day];

      return { ...prev, operatingDays: next.length ? next : ['Daily'] };
    });
  };

  const buildPayload = () => ({
    district_id: Number(form.district_id),
    district: form.district.trim(),
    province: form.province.trim(),
    type: form.type,
    routeName: form.routeName.trim(),
    routeNo: form.routeNo.trim(),
    provider: form.provider.trim(),
    serviceClass: form.serviceClass.trim() || 'Standard',
    departureStation: form.departureStation.trim(),
    arrivalStation: form.arrivalStation.trim(),
    departureTime: normalizeTime(form.departureTime),
    arrivalTime: normalizeTime(form.arrivalTime),
    duration: Number(form.duration) || 0,
    ticketPriceLKR: Number(form.ticketPriceLKR) || 0,
    operatingDays: form.operatingDays,
    contactNumber: form.contactNumber.trim(),
    bookingUrl: form.bookingUrl.trim(),
    bookingChannel: form.bookingChannel,
    paymentNotes: form.paymentNotes.trim(),
    bookingTips: form.bookingTips.trim(),
    tags: selectedTags,
    popularityScore: Number(form.popularityScore) || 0,
    isActive: form.isActive
  });

  const validate = () => {
    if (!form.type) return 'Please select a transport type.';
    if (!form.district_id) return 'Please select the destination district.';
    if (!form.provider.trim()) return 'Provider is required.';
    if (!form.departureStation.trim()) return 'Departure point is required.';
    if (!form.arrivalStation.trim()) return 'Arrival point is required.';
    if (!isValidTime(form.departureTime)) return 'Departure time must be in HH:mm format.';
    if (!isValidTime(form.arrivalTime)) return 'Arrival time must be in HH:mm format.';
    if (!form.ticketPriceLKR || Number(form.ticketPriceLKR) < 0) return 'Ticket price is required.';
    return '';
  };

  const handleSubmit = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      Alert.alert('Validation Error', validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPayload();
      if (isEditing) {
        await adminUpdateTransportScheduleApi(transportId, payload);
        Alert.alert('Success', 'Transport schedule updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await adminCreateTransportScheduleApi(payload);
        Alert.alert('Success', 'Transport schedule created successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to save transport schedule.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (!isEditing && typeConfirmed) {
      setTypeConfirmed(false);
      return;
    }
    navigation.goBack();
  };

  const renderHeader = (title) => (
    <View style={styles.header}>
      <Pressable style={styles.headerBtn} onPress={handleBack}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpace} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading schedule form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isEditing && !typeConfirmed) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader('Choose Transport Type')}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectorHero}
          >
            <View style={styles.selectorHeroIcon}>
              <Ionicons name="trail-sign-outline" size={26} color={colors.white} />
            </View>
            <Text style={styles.selectorTitle}>Start with the travel mode</Text>
            <Text style={styles.selectorSub}>
              Each mode opens a schedule form with Sri Lanka-specific defaults, booking rules and field labels.
            </Text>
          </LinearGradient>

          <View style={styles.stepRow}>
            <StepPill number="1" label="Type" active />
            <StepPill number="2" label="Route" />
            <StepPill number="3" label="Booking" />
          </View>

          <Text style={styles.sectionTitle}>Transport Type</Text>
          <View style={styles.typeList}>
            {scheduleTypeOptions.map((option) => (
              <TypeCard
                key={option.value}
                type={option.value}
                selected={form.type === option.value}
                onPress={() => handleTypeSelect(option.value)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {renderHeader(isEditing ? 'Edit Schedule' : typeCopy.title)}

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[typeMeta.color, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <Ionicons name={typeMeta.icon} size={25} color={colors.white} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{isEditing ? 'Edit route' : 'Create route'}</Text>
              <Text style={styles.heroTitle}>{form.provider || typeMeta.label}</Text>
              <Text style={styles.heroSub} numberOfLines={2}>
                {form.departureStation && form.arrivalStation
                  ? `${form.departureStation} to ${form.arrivalStation}`
                  : typeCopy.description}
              </Text>
            </View>
            {!isEditing ? (
              <Pressable style={styles.changeTypeBtn} onPress={() => setTypeConfirmed(false)}>
                <Text style={styles.changeTypeText}>Change</Text>
              </Pressable>
            ) : null}
          </LinearGradient>

          <View style={styles.stepRow}>
            <StepPill number="1" label={typeMeta.shortLabel || typeMeta.label} active />
            <StepPill number="2" label="Route" active />
            <StepPill number="3" label="Booking" active={Boolean(form.bookingChannel)} />
          </View>

          <View style={styles.previewRow}>
            <View style={styles.previewPill}>
              <Ionicons name="time-outline" size={15} color={colors.textMuted} />
              <Text style={styles.previewText}>{formatDuration(form.duration)}</Text>
            </View>
            <View style={styles.previewPill}>
              <Ionicons name="cash-outline" size={15} color={colors.textMuted} />
              <Text style={styles.previewText}>{form.ticketPriceLKR ? formatLkr(form.ticketPriceLKR) : 'No fare'}</Text>
            </View>
            <View style={styles.previewPill}>
              <Ionicons name={bookingMeta.icon} size={15} color={bookingMeta.color} />
              <Text style={[styles.previewText, { color: bookingMeta.color }]}>{bookingMeta.shortLabel}</Text>
            </View>
          </View>

          {/* ── Card 1: Route ── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardTitleIcon, { backgroundColor: `${typeMeta.color}18` }]}>
                <Ionicons name={typeMeta.icon} size={16} color={typeMeta.color} />
              </View>
              <Text style={styles.sectionTitle}>Route</Text>
              {isEditing ? null : (
                <Pressable style={styles.changeTypeInline} onPress={() => setTypeConfirmed(false)}>
                  <Text style={styles.changeTypeInlineText}>Change type</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.routeFromTo}>
              <View style={styles.routeTrack}>
                <View style={[styles.routeDotFrom]} />
                <View style={styles.routeTrackLine} />
                <View style={[styles.routeDotTo, { backgroundColor: typeMeta.color }]} />
              </View>
              <View style={styles.routeInputsCol}>
                <AppInput
                  label={typeCopy.departureLabel}
                  value={form.departureStation}
                  onChangeText={(value) => handleChange('departureStation', value)}
                  placeholder={typeCopy.departurePlaceholder}
                  leftIcon="location-outline"
                />
                <AppInput
                  label={typeCopy.arrivalLabel}
                  value={form.arrivalStation}
                  onChangeText={handleArrivalChange}
                  placeholder={typeCopy.arrivalPlaceholder}
                  leftIcon="flag-outline"
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={styles.half}>
                <AppInput
                  label={typeCopy.routeNameLabel}
                  value={form.routeName}
                  onChangeText={(value) => handleChange('routeName', value)}
                  placeholder={typeCopy.routeNamePlaceholder}
                  leftIcon="trail-sign-outline"
                />
              </View>
              <View style={styles.half}>
                <AppInput
                  label={typeCopy.routeNoLabel}
                  value={form.routeNo}
                  onChangeText={(value) => handleChange('routeNo', value)}
                  placeholder={typeCopy.routeNoPlaceholder}
                  leftIcon="pricetag-outline"
                />
              </View>
            </View>
          </View>

          {/* ── Card 2: Schedule & Fare ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Schedule & Fare</Text>
            <View style={styles.twoCol}>
              <View style={styles.half}>
                <AppInput
                  label="Depart HH:mm *"
                  value={form.departureTime}
                  onChangeText={(value) => handleChange('departureTime', value)}
                  placeholder="05:55"
                  leftIcon="time-outline"
                />
              </View>
              <View style={styles.half}>
                <AppInput
                  label="Arrive HH:mm *"
                  value={form.arrivalTime}
                  onChangeText={(value) => handleChange('arrivalTime', value)}
                  placeholder="08:42"
                  leftIcon="time"
                />
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={styles.half}>
                <AppInput
                  label="Duration (mins)"
                  value={form.duration}
                  onChangeText={(value) => handleChange('duration', value)}
                  placeholder="167"
                  keyboardType="numeric"
                  leftIcon="hourglass-outline"
                />
              </View>
              <View style={styles.half}>
                <AppInput
                  label={typeCopy.priceLabel}
                  value={form.ticketPriceLKR}
                  onChangeText={(value) => handleChange('ticketPriceLKR', value)}
                  placeholder="800"
                  keyboardType="numeric"
                  leftIcon="cash-outline"
                />
              </View>
            </View>
          </View>

          {/* ── Card 3: Operator ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Operator</Text>
            <AppInput
              label={typeCopy.providerLabel}
              value={form.provider}
              onChangeText={(value) => handleChange('provider', value)}
              placeholder="Provider name"
              leftIcon="business-outline"
            />
            <View style={styles.twoCol}>
              <View style={styles.half}>
                <AppSelect
                  label={typeCopy.classLabel}
                  value={form.serviceClass}
                  options={serviceClassOptions}
                  onChange={handleServiceClassChange}
                  placeholder="Select class"
                  leftIcon="ticket-outline"
                />
              </View>
              <View style={styles.half}>
                <AppInput
                  label="Contact"
                  value={form.contactNumber}
                  onChangeText={(value) => handleChange('contactNumber', value)}
                  placeholder="1919, +94..."
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                />
              </View>
            </View>
          </View>

          {/* ── Card 4: Operating Days ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Operating Days</Text>
            <View style={styles.dayGrid}>
              {DAY_OPTIONS.map((day) => (
                <DayChip
                  key={day}
                  day={day}
                  active={form.operatingDays.includes(day)}
                  onPress={() => toggleDay(day)}
                />
              ))}
            </View>
          </View>

          {/* ── Card 5: Booking Guide ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Booking Guide</Text>
            <AppSelect
              label="Booking Channel"
              value={form.bookingChannel}
              options={bookingChannelOptions}
              onChange={handleBookingChannelChange}
              leftIcon={bookingMeta.icon}
            />
            <AppInput
              label="Booking URL"
              value={form.bookingUrl}
              onChangeText={(value) => handleChange('bookingUrl', value)}
              placeholder={form.type === 'intercity-train' ? RAILWAY_BOOKING_URL : 'https://...'}
              autoCapitalize="none"
              leftIcon="link-outline"
            />
            <GuidanceField
              label="Payment Notes"
              value={form.paymentNotes}
              onChangeText={(value) => handleChange('paymentNotes', value)}
              placeholder="Card, LANKAQR, cash at terminal, counter fare..."
              icon="card-outline"
            />
            <GuidanceField
              label="Booking Tips"
              value={form.bookingTips}
              onChangeText={(value) => handleChange('bookingTips', value)}
              placeholder="Reserve early, confirm sea conditions, ask for direct bus..."
              icon="bulb-outline"
            />
          </View>

          {/* ── Card 6: Tags & Publish ── */}
          <View style={styles.card}>
            <View style={styles.tagPanel}>
              <View style={styles.tagPanelHeader}>
                <View style={styles.tagTitleRow}>
                  <Ionicons name="bookmark-outline" size={17} color={colors.primary} />
                  <Text style={styles.tagPanelTitle}>Route Tags</Text>
                </View>
                <Text style={styles.tagCount}>{selectedTags.length} selected</Text>
              </View>
              <AppSelect
                value=""
                options={addableTagOptions}
                onChange={handleAddTag}
                placeholder={addableTagOptions.length ? 'Add another tag' : 'All suggested tags selected'}
                leftIcon="add-circle-outline"
                disabled={!addableTagOptions.length}
              />
              <View style={styles.selectedTagsWrap}>
                {selectedTags.length ? (
                  selectedTags.map((tag) => (
                    <Pressable key={tag} style={styles.selectedTag} onPress={() => handleRemoveTag(tag)}>
                      <Text style={styles.selectedTagText}>{tag}</Text>
                      <Ionicons name="close" size={12} color={colors.primary} />
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.tagHint}>Pick tags that help users scan this route.</Text>
                )}
              </View>
            </View>
            <View style={styles.publishRow}>
              <View style={styles.scorePanel}>
                <View style={styles.scoreLabelRow}>
                  <Ionicons name="sparkles-outline" size={17} color={colors.primary} />
                  <Text style={styles.scoreLabel}>Popularity</Text>
                </View>
                <View style={styles.scoreInputRow}>
                  <TextInput
                    value={form.popularityScore}
                    onChangeText={(value) => handleChange('popularityScore', value)}
                    placeholder="80"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={3}
                    style={styles.scoreInput}
                  />
                  <Text style={styles.scoreSuffix}>/100</Text>
                </View>
              </View>
              <Pressable
                style={[styles.publishPanel, form.isActive ? styles.publishPanelActive : styles.publishPanelInactive]}
                onPress={() => handleChange('isActive', !form.isActive)}
              >
                <Ionicons
                  name={form.isActive ? 'eye-outline' : 'eye-off-outline'}
                  size={21}
                  color={form.isActive ? colors.white : colors.textMuted}
                />
                <View style={styles.publishCopy}>
                  <Text style={[styles.publishTitle, form.isActive && styles.publishTitleActive]}>
                    {form.isActive ? 'Visible' : 'Hidden'}
                  </Text>
                  <Text style={[styles.publishSub, form.isActive && styles.publishSubActive]}>
                    {form.isActive ? 'Shown to users' : 'Draft only'}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.districtOverrideRow}>
              <Ionicons name="map-outline" size={14} color={colors.textMuted} />
              <Text style={styles.districtOverrideLabel}>
                {form.district ? `District: ${form.district}` : 'District auto-detected from arrival'}
              </Text>
              <AppSelect
                value={form.district_id}
                options={districtOptions}
                onChange={handleDistrictChange}
                placeholder="Override district"
                leftIcon="chevron-down-outline"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}>
          <AppButton
            title={isEditing ? 'Save Schedule' : `Add ${typeMeta.shortLabel || typeMeta.label} Schedule`}
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  headerSpace: { width: 42 },
  content: { padding: 16, paddingBottom: 24 },
  selectorHero: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14
  },
  selectorHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  selectorTitle: { color: colors.white, fontSize: 24, fontWeight: '900' },
  selectorSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 6 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stepPill: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 7
  },
  stepPillActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary + '44' },
  stepNumber: { color: colors.textMuted, fontSize: 11, fontWeight: '900' },
  stepNumberActive: { color: colors.primary },
  stepLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '900' },
  stepLabelActive: { color: colors.primary },
  typeList: { gap: 10 },
  typeCard: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  typeCardBody: { flex: 1 },
  typeName: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  typeDescription: { color: colors.textMuted, fontSize: 11, fontWeight: '700', lineHeight: 16, marginTop: 3 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  heroTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700', marginTop: 3, lineHeight: 17 },
  changeTypeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  changeTypeText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  previewRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  previewPill: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 7
  },
  previewText: { color: colors.textSecondary, fontSize: 11, fontWeight: '900' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitleIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  changeTypeInline: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  changeTypeInlineText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  routeFromTo: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  routeTrack: { alignItems: 'center', paddingTop: 30, paddingBottom: 14, gap: 0, width: 18 },
  routeDotFrom: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primaryDark, borderWidth: 2, borderColor: colors.primary },
  routeTrackLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4, borderRadius: 1 },
  routeDotTo: { width: 12, height: 12, borderRadius: 6 },
  routeInputsCol: { flex: 1 },
  districtOverrideRow: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 },
  districtOverrideLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  selectedTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 16
  },
  selectedTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedTypeCopy: { flex: 1 },
  selectedTypeLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  selectedTypeValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '900', marginTop: 2 },
  twoCol: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  mapPreviewCard: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 12
  },
  mapPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10
  },
  mapPreviewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  mapPreviewTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  mapPreviewBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  mapPreviewBadge: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  mapFrame: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface3
  },
  routeMap: { width: '100%', height: '100%' },
  mapEmptyState: {
    minHeight: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18
  },
  mapEmptyTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', marginTop: 8 },
  mapEmptySub: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 16, marginTop: 4 },
  mapLegendRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  mapLegendItem: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 9
  },
  mapLegendDot: { width: 8, height: 8, borderRadius: 4 },
  mapLegendText: { flex: 1, color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  mapPreviewNote: { color: colors.textMuted, fontSize: 11, fontWeight: '700', lineHeight: 16, marginTop: 9 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  dayChipTextActive: { color: colors.white },
  guidanceField: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 12,
    marginBottom: 12
  },
  guidanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8
  },
  guidanceLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  guidanceInput: {
    minHeight: 78,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    padding: 0
  },
  tagPanel: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 12,
    marginBottom: 12
  },
  tagPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10
  },
  tagTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1
  },
  tagPanelTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  tagCount: { color: colors.textMuted, fontSize: 11, fontWeight: '900' },
  selectedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -2
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '33'
  },
  selectedTagText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  tagHint: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  scorePanel: {
    flex: 1,
    minHeight: 74,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 12,
    justifyContent: 'space-between'
  },
  scoreLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  scoreLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 6
  },
  scoreInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    padding: 0
  },
  scoreSuffix: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  publishPanel: {
    flex: 1,
    minHeight: 74,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12
  },
  publishPanelActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  publishPanelInactive: { backgroundColor: colors.surface2, borderColor: colors.border },
  publishCopy: { flex: 1, minWidth: 0 },
  publishTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  publishTitleActive: { color: colors.white },
  publishSub: { color: colors.textMuted, fontSize: 11, fontWeight: '800', marginTop: 2 },
  publishSubActive: { color: 'rgba(255,255,255,0.78)' },
  toggleBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleBtnInactive: { backgroundColor: colors.surface2 },
  toggleText: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  toggleTextActive: { color: colors.white },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8
  }
});

export default AdminTransportFormScreen;
