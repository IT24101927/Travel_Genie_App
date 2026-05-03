const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const TransportSchedule = require('../modules/transport/models/TransportSchedule');
const { connectDatabase } = require('../config/db');

const transportData = [
  {
    district_id: 4,
    district: 'Kandy',
    province: 'Central',
    type: 'intercity-train',
    routeName: 'Podi Menike',
    routeNo: '1005',
    provider: 'Sri Lanka Railways',
    serviceClass: '2nd Class Reserved',
    departureStation: 'Colombo Fort Railway Station',
    arrivalStation: 'Kandy Railway Station',
    departureTime: '05:55',
    arrivalTime: '08:42',
    duration: 167,
    ticketPriceLKR: 800,
    operatingDays: ['Daily'],
    contactNumber: '1919',
    bookingUrl: 'https://srilanka-railways.com',
    bookingChannel: 'official-online',
    paymentNotes: 'Online railway reservations support card payments and LANKAQR. Carry the e-ticket plus NIC or passport.',
    bookingTips: 'Use the Sri Lanka Railways booking site for reserved seats. Seats can usually be reserved ahead of travel.',
    tags: ['scenic', 'railway', 'heritage'],
    popularityScore: 98,
    isActive: true
  },
  {
    district_id: 22,
    district: 'Badulla',
    province: 'Uva',
    type: 'intercity-train',
    routeName: 'Ella Odyssey',
    routeNo: '1007',
    provider: 'Sri Lanka Railways',
    serviceClass: '1st Class AC',
    departureStation: 'Colombo Fort Railway Station',
    arrivalStation: 'Ella Railway Station',
    departureTime: '05:30',
    arrivalTime: '15:15',
    duration: 585,
    ticketPriceLKR: 5000,
    operatingDays: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
    contactNumber: '1919',
    bookingUrl: 'https://srilanka-railways.com',
    bookingChannel: 'official-online',
    paymentNotes: 'Online railway reservations support card payments and LANKAQR. Carry the e-ticket plus NIC or passport.',
    bookingTips: 'Book early for Ella. Best for hill-country views. Sit on the right side after Nanu Oya toward Ella.',
    tags: ['ella', 'scenic', 'hill-country'],
    popularityScore: 100,
    isActive: true
  },
  {
    district_id: 10,
    district: 'Jaffna',
    province: 'Northern',
    type: 'intercity-train',
    routeName: 'Yal Devi',
    routeNo: '4001',
    provider: 'Sri Lanka Railways',
    serviceClass: '1st Class AC',
    departureStation: 'Colombo Fort Railway Station',
    arrivalStation: 'Jaffna Railway Station',
    departureTime: '05:45',
    arrivalTime: '13:00',
    duration: 435,
    ticketPriceLKR: 4500,
    operatingDays: ['Daily'],
    contactNumber: '1919',
    bookingUrl: 'https://srilanka-railways.com',
    bookingChannel: 'official-online',
    paymentNotes: 'Online railway reservations support card payments and LANKAQR. Carry the e-ticket plus NIC or passport.',
    bookingTips: 'Reserved seats are recommended for the full route. Carry water and snacks for the long journey.',
    tags: ['northern', 'railway', 'long-distance'],
    popularityScore: 89,
    isActive: true
  },
  {
    district_id: 8,
    district: 'Matara',
    province: 'Southern',
    type: 'intercity-train',
    routeName: 'Ruhunu Kumari',
    routeNo: '8056',
    provider: 'Sri Lanka Railways',
    serviceClass: '2nd Class',
    departureStation: 'Colombo Fort Railway Station',
    arrivalStation: 'Matara Railway Station',
    departureTime: '15:40',
    arrivalTime: '18:50',
    duration: 190,
    ticketPriceLKR: 700,
    operatingDays: ['Daily'],
    contactNumber: '1919',
    bookingUrl: 'https://srilanka-railways.com',
    bookingChannel: 'official-online',
    paymentNotes: 'Online railway reservations support card payments and LANKAQR. Unreserved travel still uses station counter tickets.',
    bookingTips: 'Good coastal option for Mirissa, Weligama and Matara stays.',
    tags: ['coastal', 'south', 'railway'],
    popularityScore: 85,
    isActive: true
  },
  {
    district_id: 7,
    district: 'Galle',
    province: 'Southern',
    type: 'express-bus',
    routeName: 'Southern Expressway',
    routeNo: 'EX001',
    provider: 'SLTB Highway Bus',
    serviceClass: 'Luxury AC',
    departureStation: 'Makumbura Multimodal Centre',
    arrivalStation: 'Galle Central Bus Stand',
    departureTime: '07:00',
    arrivalTime: '08:30',
    duration: 90,
    ticketPriceLKR: 1200,
    operatingDays: ['Daily'],
    contactNumber: '1315',
    bookingUrl: 'https://sltb.eseat.lk/home',
    bookingChannel: 'authorized-online',
    paymentNotes: 'Check SLTB eSeat for reservable CTB buses. Counter tickets and onboard cash may still apply on non-listed departures.',
    bookingTips: 'Makumbura is the easiest highway terminal if you start from Colombo suburbs.',
    tags: ['expressway', 'south', 'ac-bus'],
    popularityScore: 96,
    isActive: true
  },
  {
    district_id: 8,
    district: 'Matara',
    province: 'Southern',
    type: 'express-bus',
    routeName: 'Kadawatha to Matara Express',
    routeNo: 'EX-1-21',
    provider: 'Private Highway Express',
    serviceClass: 'Super Luxury AC',
    departureStation: 'Kadawatha Highway Bus Stand',
    arrivalStation: 'Matara Bus Stand',
    departureTime: '08:00',
    arrivalTime: '10:15',
    duration: 135,
    ticketPriceLKR: 1500,
    operatingDays: ['Daily'],
    contactNumber: '1955',
    bookingUrl: 'https://www.ntc.gov.lk/Bus_info/time_table.php',
    bookingChannel: 'counter',
    paymentNotes: 'Use NTC timetable and fare info as a planning reference, then buy at the terminal or confirm with the operator.',
    bookingTips: 'Useful for Mirissa and Weligama. Confirm final stop with the conductor.',
    tags: ['expressway', 'beach', 'south'],
    popularityScore: 91,
    isActive: true
  },
  {
    district_id: 20,
    district: 'Anuradhapura',
    province: 'North Central',
    type: 'public-bus',
    routeName: 'Pettah to Anuradhapura',
    routeNo: '15',
    provider: 'SLTB',
    serviceClass: 'Semi Luxury',
    departureStation: 'Colombo Central Bus Stand - Pettah',
    arrivalStation: 'Anuradhapura New Bus Stand',
    departureTime: '10:00',
    arrivalTime: '14:00',
    duration: 240,
    ticketPriceLKR: 900,
    operatingDays: ['Daily'],
    contactNumber: '1315',
    bookingUrl: 'https://sltb.eseat.lk/home',
    bookingChannel: 'authorized-online',
    paymentNotes: 'Try SLTB eSeat for reservable CTB services. If unavailable, buy at Pettah or pay cash onboard.',
    bookingTips: 'A daytime option for the cultural triangle. Ask for a direct bus.',
    tags: ['cultural-triangle', 'sltb', 'heritage'],
    popularityScore: 78,
    isActive: true
  },
  {
    district_id: 21,
    district: 'Polonnaruwa',
    province: 'North Central',
    type: 'public-bus',
    routeName: 'Colombo to Polonnaruwa',
    routeNo: '48',
    provider: 'Private Route 48',
    serviceClass: 'Normal',
    departureStation: 'Colombo Central Bus Stand - Pettah',
    arrivalStation: 'Polonnaruwa Bus Stand',
    departureTime: '06:00',
    arrivalTime: '11:30',
    duration: 330,
    ticketPriceLKR: 800,
    operatingDays: ['Daily'],
    contactNumber: '1955',
    bookingUrl: 'https://www.ntc.gov.lk/Bus_info/time_table.php',
    bookingChannel: 'onboard-cash',
    paymentNotes: 'Private route buses are commonly paid at the terminal or onboard in cash. Keep smaller notes ready.',
    bookingTips: 'Leave early to reach the ancient city before the hottest part of the day.',
    tags: ['heritage', 'budget', 'direct-bus'],
    popularityScore: 74,
    isActive: true
  },
  {
    district_id: 17,
    district: 'Trincomalee',
    province: 'Eastern',
    type: 'public-bus',
    routeName: 'Colombo to Trincomalee Night Bus',
    routeNo: '49',
    provider: 'Private Intercity',
    serviceClass: 'Semi Luxury',
    departureStation: 'Colombo Central Bus Stand - Pettah',
    arrivalStation: 'Trincomalee Bus Stand',
    departureTime: '22:00',
    arrivalTime: '05:30',
    duration: 450,
    ticketPriceLKR: 1800,
    operatingDays: ['Daily'],
    contactNumber: '1955',
    bookingUrl: 'https://www.ntc.gov.lk/Bus_info/time_table.php',
    bookingChannel: 'counter',
    paymentNotes: 'Use NTC timetable and fare info as a planning reference. Buy at the terminal and confirm the bay before departure.',
    bookingTips: 'Night services are popular before beach season weekends. Arrive early for seats.',
    tags: ['east-coast', 'night-bus', 'beach'],
    popularityScore: 86,
    isActive: true
  },
  {
    district_id: 15,
    district: 'Batticaloa',
    province: 'Eastern',
    type: 'intercity-train',
    routeName: 'Udaya Devi',
    routeNo: '6079',
    provider: 'Sri Lanka Railways',
    serviceClass: '2nd Class',
    departureStation: 'Colombo Fort Railway Station',
    arrivalStation: 'Batticaloa Railway Station',
    departureTime: '06:05',
    arrivalTime: '14:20',
    duration: 495,
    ticketPriceLKR: 1300,
    operatingDays: ['Daily'],
    contactNumber: '1919',
    bookingUrl: 'https://srilanka-railways.com',
    bookingChannel: 'official-online',
    paymentNotes: 'Online railway reservations support card payments and LANKAQR. Carry the e-ticket plus NIC or passport.',
    bookingTips: 'Best for travelers heading toward Pasikudah and eastern lagoon stays.',
    tags: ['east', 'railway', 'lagoon'],
    popularityScore: 82,
    isActive: true
  },
  {
    district_id: 6,
    district: 'Nuwara Eliya',
    province: 'Central',
    type: 'private-van',
    routeName: 'Kandy to Nuwara Eliya Scenic Van',
    routeNo: 'KDY-NE',
    provider: 'Hill Country Tours',
    serviceClass: 'Shared Van',
    departureStation: 'Kandy Clock Tower',
    arrivalStation: 'Nuwara Eliya Post Office',
    departureTime: '09:00',
    arrivalTime: '12:30',
    duration: 210,
    ticketPriceLKR: 3500,
    operatingDays: ['Daily'],
    contactNumber: '+94771234567',
    bookingChannel: 'hotline',
    paymentNotes: 'Confirm by phone or WhatsApp before travel. Agree pickup point, luggage space, fuel/toll extras and payment method.',
    bookingTips: 'Ask for photo stops at Ramboda Falls and tea viewpoints before confirming.',
    tags: ['shared-van', 'tea-country', 'scenic'],
    popularityScore: 84,
    isActive: true
  },
  {
    district_id: 9,
    district: 'Hambantota',
    province: 'Southern',
    type: 'private-van',
    routeName: 'Tissamaharama Safari Transfer',
    routeNo: 'YALA-VAN',
    provider: 'Yala Safari Transfers',
    serviceClass: 'Private Van',
    departureStation: 'Matara Bus Stand',
    arrivalStation: 'Tissamaharama Town',
    departureTime: '11:30',
    arrivalTime: '14:30',
    duration: 180,
    ticketPriceLKR: 12000,
    operatingDays: ['Daily'],
    contactNumber: '+94773456789',
    bookingChannel: 'hotline',
    paymentNotes: 'Confirm by phone or WhatsApp before travel. Agree pickup point, luggage space, fuel/toll extras and payment method.',
    bookingTips: 'Works well if you are connecting to Yala or Bundala safari lodges.',
    tags: ['yala', 'private-transfer', 'wildlife'],
    popularityScore: 73,
    isActive: true
  },
  {
    district_id: 24,
    district: 'Ratnapura',
    province: 'Sabaragamuwa',
    type: 'public-bus',
    routeName: 'Colombo to Ratnapura',
    routeNo: '99',
    provider: 'SLTB',
    serviceClass: 'Normal',
    departureStation: 'Colombo Central Bus Stand - Pettah',
    arrivalStation: 'Ratnapura Main Bus Stand',
    departureTime: '07:30',
    arrivalTime: '10:15',
    duration: 165,
    ticketPriceLKR: 520,
    operatingDays: ['Daily'],
    contactNumber: '1315',
    bookingUrl: 'https://sltb.eseat.lk/home',
    bookingChannel: 'authorized-online',
    paymentNotes: 'Try SLTB eSeat for reservable CTB services. If unavailable, use the terminal counter or onboard cash.',
    bookingTips: "A budget route for Adam's Peak access via Ratnapura side.",
    tags: ['budget', 'adams-peak', 'sabaragamuwa'],
    popularityScore: 69,
    isActive: true
  },
  {
    district_id: 7,
    district: 'Galle',
    province: 'Southern',
    type: 'taxi',
    routeName: 'Airport to Galle Transfer',
    routeNo: 'BIA-GLE',
    provider: 'PickMe Intercity',
    serviceClass: 'Car',
    departureStation: 'Bandaranaike International Airport',
    arrivalStation: 'Galle Fort',
    departureTime: '09:00',
    arrivalTime: '11:20',
    duration: 140,
    ticketPriceLKR: 18500,
    operatingDays: ['Daily'],
    bookingUrl: 'https://pickme.lk/services/ride/',
    bookingChannel: 'mobile-app',
    paymentNotes: 'Book in the PickMe app. Confirm tolls, luggage capacity and final fare estimate before starting.',
    bookingTips: 'Confirm expressway tolls and luggage space before accepting the ride.',
    tags: ['airport', 'taxi', 'pickme', 'ride-hailing', 'galle-fort'],
    popularityScore: 80,
    isActive: true
  },
  {
    district_id: 4,
    district: 'Kandy',
    province: 'Central',
    type: 'taxi',
    routeName: 'Airport to Kandy Transfer',
    routeNo: 'BIA-KDY',
    provider: 'Uber Intercity',
    serviceClass: 'Car',
    departureStation: 'Bandaranaike International Airport',
    arrivalStation: 'Kandy City Centre',
    departureTime: '10:00',
    arrivalTime: '13:20',
    duration: 200,
    ticketPriceLKR: 22000,
    operatingDays: ['Daily'],
    bookingUrl: 'https://www.uber.com/lk/en/',
    bookingChannel: 'mobile-app',
    paymentNotes: 'Book in the Uber app where available. Confirm tolls, luggage capacity and pickup instructions.',
    bookingTips: 'Choose a larger vehicle if carrying surfboards or multiple suitcases.',
    tags: ['airport', 'taxi', 'uber', 'ride-hailing', 'kandy'],
    popularityScore: 76,
    isActive: true
  },
  {
    district_id: 1,
    district: 'Colombo',
    province: 'Western',
    type: 'taxi',
    routeName: 'BIA Airport Taxi Counter to Colombo',
    routeNo: 'AASL-CMB',
    provider: 'Airport and Aviation Services Taxi Counter',
    serviceClass: 'Air Conditioned Taxi',
    departureStation: 'Bandaranaike International Airport Arrival Lobby',
    arrivalStation: 'Colombo City',
    departureTime: '00:00',
    arrivalTime: '00:45',
    duration: 45,
    ticketPriceLKR: 6500,
    operatingDays: ['Daily'],
    contactNumber: '+94112263096',
    bookingUrl: 'https://www.airport.lk/passenger_guide/getting_arround/taxi_service.php',
    bookingChannel: 'airport-counter',
    paymentNotes: 'Use the supervised airport taxi counters in the arrival lobby or arrival porch. Extra kilometers and extra drops are charged separately.',
    bookingTips: 'Good fallback when ride-hailing pickup is difficult after arrival. Confirm the destination rate at the counter.',
    tags: ['airport', 'official-counter', 'taxi'],
    popularityScore: 79,
    isActive: true
  },
  {
    district_id: 7,
    district: 'Galle',
    province: 'Southern',
    type: 'domestic-flight',
    routeName: 'BIA to Koggala Air Taxi',
    routeNo: 'CIN-GLE',
    provider: 'Cinnamon Air',
    serviceClass: 'Economy',
    departureStation: 'Bandaranaike International Airport',
    arrivalStation: 'Koggala Airport',
    departureTime: '10:00',
    arrivalTime: '10:45',
    duration: 45,
    ticketPriceLKR: 45000,
    operatingDays: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
    contactNumber: '+94112475475',
    bookingUrl: 'https://www.cinnamonair.com/contact-us/',
    bookingChannel: 'official-online',
    paymentNotes: 'Use Cinnamon Air booking/contact channels and confirm baggage allowance before payment.',
    bookingTips: 'Fastest option for south-coast premium itineraries and short stays.',
    tags: ['domestic-flight', 'premium', 'south'],
    popularityScore: 67,
    isActive: true
  },
  {
    district_id: 19,
    district: 'Puttalam',
    province: 'North Western',
    type: 'domestic-flight',
    routeName: 'BIA to Kalpitiya Lagoon',
    routeNo: 'CIN-KLP',
    provider: 'Cinnamon Air',
    serviceClass: 'Economy',
    departureStation: 'Bandaranaike International Airport',
    arrivalStation: 'Kalpitiya Water Aerodrome',
    departureTime: '14:00',
    arrivalTime: '14:35',
    duration: 35,
    ticketPriceLKR: 52000,
    operatingDays: ['Tuesday', 'Thursday', 'Saturday'],
    contactNumber: '+94112475475',
    bookingUrl: 'https://www.cinnamonair.com/contact-us/',
    bookingChannel: 'official-online',
    paymentNotes: 'Use Cinnamon Air booking/contact channels and confirm baggage allowance before payment.',
    bookingTips: 'Ideal for kite-surfing season when road transfers are too long.',
    tags: ['kalpitiya', 'domestic-flight', 'lagoon'],
    popularityScore: 58,
    isActive: true
  },
  {
    district_id: 10,
    district: 'Jaffna',
    province: 'Northern',
    type: 'ferry',
    routeName: 'Kurikadduwan to Delft Island',
    routeNo: 'KKD-DLF',
    provider: 'Northern Passenger Ferry',
    serviceClass: 'Standard',
    departureStation: 'Kurikadduwan Jetty',
    arrivalStation: 'Delft Island Jetty',
    departureTime: '08:00',
    arrivalTime: '08:45',
    duration: 45,
    ticketPriceLKR: 200,
    operatingDays: ['Daily'],
    bookingChannel: 'local-check',
    paymentNotes: 'No reliable public online booking. Check locally at Jaffna, Kurikadduwan Jetty or your hotel before departure.',
    bookingTips: 'Schedules can change with sea conditions and vessel capacity. Check locally before leaving Jaffna.',
    tags: ['island', 'ferry', 'jaffna'],
    popularityScore: 72,
    isActive: true
  }
];

const Place = require('../modules/places/place.model');
const Hotel = require('../modules/hotels/hotel.model');

const CITIES_AND_PROVINCES = {
  'Colombo': 'Western',
  'Gampaha': 'Western',
  'Kalutara': 'Western',
  'Kandy': 'Central',
  'Matale': 'Central',
  'Nuwara Eliya': 'Central',
  'Galle': 'Southern',
  'Matara': 'Southern',
  'Hambantota': 'Southern',
  'Jaffna': 'Northern',
  'Kilinochchi': 'Northern',
  'Mannar': 'Northern',
  'Vavuniya': 'Northern',
  'Mullaitivu': 'Northern',
  'Batticaloa': 'Eastern',
  'Ampara': 'Eastern',
  'Trincomalee': 'Eastern',
  'Kurunegala': 'North Western',
  'Puttalam': 'North Western',
  'Anuradhapura': 'North Central',
  'Polonnaruwa': 'North Central',
  'Badulla': 'Uva',
  'Moneragala': 'Uva',
  'Ratnapura': 'Sabaragamuwa',
  'Kegalle': 'Sabaragamuwa'
};

const MAX_DYNAMIC_RECORDS = 4000;

const generateDummies = async () => {
  const places = await Place.find().select('name district');
  const hotels = await Hotel.find().select('name district');
  
  // Ensure we have all 25 districts by using the keys of CITIES_AND_PROVINCES
  const allDistricts = Object.keys(CITIES_AND_PROVINCES);

  const dynamicTransports = [];
  
  const formatTime = (hours, mins) => `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

  // All 25 districts to all 24 other districts = 600 pairs
  for (const originDistrict of allDistricts) {
    for (const destDistrict of allDistricts) {
      if (originDistrict === destDistrict) continue;
      if (dynamicTransports.length >= MAX_DYNAMIC_RECORDS) break;

      const province = CITIES_AND_PROVINCES[destDistrict] || 'Unknown';
      const baseDistanceMs = Math.floor(Math.random() * 200) + 60;

      // 2-3 Public Buses
      const numBuses = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numBuses; i++) {
        const busStart = 4 + Math.floor(Math.random() * 16);
        const busEnd = baseDistanceMs + Math.floor(Math.random() * 30);
        let busEndH = busStart + Math.floor(busEnd / 60);
        if (busEndH > 23) busEndH = 23;
        dynamicTransports.push({
          district_id: 0, district: destDistrict, province, type: 'public-bus',
          routeName: `${originDistrict} to ${destDistrict}`,
          routeNo: `PUB-${Math.floor(Math.random()*900)+100}`,
          provider: Math.random() > 0.5 ? 'SLTB' : 'Private Operator',
          serviceClass: 'Normal',
          departureStation: `${originDistrict} Main Bus Stand`, arrivalStation: `${destDistrict} Main Bus Stand`,
          departureTime: formatTime(busStart, Math.floor(Math.random() * 6) * 10), arrivalTime: formatTime(busEndH, busEnd % 60),
          duration: busEnd, ticketPriceLKR: 300 + Math.floor(baseDistanceMs * 3),
          operatingDays: ['Daily'], contactNumber: '1955', bookingUrl: 'https://sltb.eseat.lk',
          bookingChannel: 'counter', paymentNotes: 'Cash accepted onboard.',
          bookingTips: 'Arrive 15 mins early to secure a seat.',
          tags: ['budget', 'bus'], popularityScore: Math.floor(Math.random() * 40) + 40, isActive: true
        });
      }

      // 1-2 Express Buses
      const numExp = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numExp; i++) {
        const expStart = 5 + Math.floor(Math.random() * 14);
        const expEnd = Math.floor(baseDistanceMs * 0.75);
        let expEndH = expStart + Math.floor(expEnd / 60);
        if (expEndH > 23) expEndH = 23;
        dynamicTransports.push({
          district_id: 0, district: destDistrict, province, type: 'express-bus',
          routeName: `${originDistrict} - ${destDistrict} Highway`,
          routeNo: `EX-${Math.floor(Math.random()*90)+10}`,
          provider: 'Highway Express', serviceClass: 'Luxury AC',
          departureStation: `${originDistrict} Main Bus Stand`, arrivalStation: `${destDistrict} Highway Stand`,
          departureTime: formatTime(expStart, Math.floor(Math.random() * 4) * 15), arrivalTime: formatTime(expEndH, expEnd % 60),
          duration: expEnd, ticketPriceLKR: 800 + Math.floor(baseDistanceMs * 6),
          operatingDays: ['Daily'], contactNumber: '1955', bookingUrl: 'https://sltb.eseat.lk',
          bookingChannel: 'authorized-online', paymentNotes: 'Book online or pay cash at counter.',
          bookingTips: 'Best for comfortable fast travel.',
          tags: ['ac-bus', 'highway'], popularityScore: Math.floor(Math.random() * 30) + 70, isActive: true
        });
      }

      // 1 Train (70% chance)
      if (Math.random() > 0.3) {
        const trnStart = 5 + Math.floor(Math.random() * 12);
        const trnEnd = Math.floor(baseDistanceMs * 1.1);
        let trnEndH = trnStart + Math.floor(trnEnd / 60);
        if (trnEndH > 23) trnEndH = 23;
        dynamicTransports.push({
          district_id: 0, district: destDistrict, province, type: 'intercity-train',
          routeName: `${originDistrict} to ${destDistrict} Train`,
          routeNo: `TRN-${Math.floor(Math.random()*9000)+1000}`,
          provider: 'Sri Lanka Railways', serviceClass: '2nd Class Reserved',
          departureStation: `${originDistrict} Railway Station`, arrivalStation: `${destDistrict} Railway Station`,
          departureTime: formatTime(trnStart, 0), arrivalTime: formatTime(trnEndH, trnEnd % 60),
          duration: trnEnd, ticketPriceLKR: 500 + Math.floor(baseDistanceMs * 4),
          operatingDays: ['Daily'], contactNumber: '1919', bookingUrl: 'https://srilanka-railways.com',
          bookingChannel: 'official-online', paymentNotes: 'Card and mobile payments online.',
          bookingTips: 'Book up to 14 days in advance.',
          tags: ['railway', 'scenic'], popularityScore: Math.floor(Math.random() * 20) + 80, isActive: true
        });
      }

      // 1 Taxi / PickMe
      dynamicTransports.push({
        district_id: 0, district: destDistrict, province, type: 'taxi',
        routeName: `${originDistrict} to ${destDistrict} Private Taxi`,
        routeNo: `TAXI-${Math.floor(Math.random()*9000)+1000}`,
        provider: 'PickMe / Uber / Local Taxi', serviceClass: 'Car/Mini Van',
        departureStation: `${originDistrict} Any Point`, arrivalStation: `${destDistrict} Any Hotel`,
        departureTime: '00:00', arrivalTime: '23:59', duration: baseDistanceMs,
        ticketPriceLKR: 10000 + Math.floor(baseDistanceMs * 80),
        operatingDays: ['Daily'], contactNumber: '+94 112 000 000',
        bookingUrl: 'https://pickme.lk', bookingChannel: 'mobile-app',
        paymentNotes: 'Pay via App or Cash', bookingTips: 'Available 24/7. Confirm tolls with driver.',
        tags: ['taxi', 'private', 'door-to-door'],
        popularityScore: Math.floor(Math.random() * 20) + 60, isActive: true
      });
      
      // 1 Private Van (50% chance)
      if (Math.random() > 0.5) {
        const vanStart = 8 + Math.floor(Math.random() * 4);
        const vanEnd = Math.floor(baseDistanceMs * 0.9);
        let vanEndH = vanStart + Math.floor(vanEnd / 60);
        if (vanEndH > 23) vanEndH = 23;
        dynamicTransports.push({
          district_id: 0, district: destDistrict, province, type: 'private-van',
          routeName: `${originDistrict} to ${destDistrict} VIP Van`,
          routeNo: `VAN-${Math.floor(Math.random()*900)+100}`,
          provider: 'Tourist Transport Service', serviceClass: 'AC Van',
          departureStation: `${originDistrict} City Center`, arrivalStation: `${destDistrict} Any Point`,
          departureTime: formatTime(vanStart, 30), arrivalTime: formatTime(vanEndH, vanEnd % 60),
          duration: vanEnd, ticketPriceLKR: 8000 + Math.floor(baseDistanceMs * 60),
          operatingDays: ['Daily'], contactNumber: '+94 77 123 4567', bookingUrl: '',
          bookingChannel: 'hotline', paymentNotes: 'Cash or Bank Transfer',
          bookingTips: 'Ideal for groups of 4-8 people.',
          tags: ['van', 'private', 'tourist'], popularityScore: Math.floor(Math.random() * 20) + 70, isActive: true
        });
      }
    }
    if (dynamicTransports.length >= MAX_DYNAMIC_RECORDS) break;
  }

  // Generate specific local transports per Place/Hotel (last mile connectivity)
  const samplePlaces = places.slice(0, 100); // Limit to avoid too much bloat
  const sampleHotels = hotels.slice(0, 50);
  
  const generateLocalTukTuk = (item, typeStr) => {
    return {
      district_id: 0, // mock ID
      district: item.district || 'Unknown',
      province: CITIES_AND_PROVINCES[item.district] || 'Unknown',
      type: 'taxi',
      routeName: `${item.district} Station to ${item.name}`,
      routeNo: `TUK-${Math.floor(Math.random()*9000)+1000}`,
      provider: 'Local TukTuk Stand',
      serviceClass: 'Three Wheeler',
      departureStation: `${item.district} Bus/Train Station`,
      arrivalStation: item.name,
      departureTime: '00:00',
      arrivalTime: '23:59',
      duration: Math.floor(Math.random() * 40) + 5,
      ticketPriceLKR: 150 + Math.floor(Math.random() * 400),
      operatingDays: ['Daily'],
      contactNumber: 'N/A',
      bookingUrl: '',
      bookingChannel: 'counter',
      paymentNotes: 'Always agree on fare before getting in, or ask for a meter.',
      bookingTips: 'Haggle if no meter is available.',
      tags: ['local', 'tuk-tuk', typeStr],
      popularityScore: Math.floor(Math.random() * 40) + 50,
      isActive: true
    };
  };

  for(const place of samplePlaces) {
    if(place.district && dynamicTransports.length < MAX_DYNAMIC_RECORDS) {
      dynamicTransports.push(generateLocalTukTuk(place, 'attraction'));
    }
  }
  for(const hotel of sampleHotels) {
    if(hotel.district && dynamicTransports.length < MAX_DYNAMIC_RECORDS) {
      dynamicTransports.push(generateLocalTukTuk(hotel, 'hotel'));
    }
  }

  return dynamicTransports.slice(0, MAX_DYNAMIC_RECORDS);
};

const seedTransports = async () => {
  try {
    await connectDatabase();
    await TransportSchedule.deleteMany({});
    
    // Seed static data
    await TransportSchedule.insertMany(transportData);
    console.log(`Seeded ${transportData.length} static transport schedules.`);

    // Seed dynamic data
    const dynamicTransports = await generateDummies();
    if(dynamicTransports.length > 0) {
      await TransportSchedule.insertMany(dynamicTransports);
      console.log(`Seeded ${dynamicTransports.length} dynamic transport schedules based on DB districts.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding transport schedules:', error);
    process.exit(1);
  }
};

seedTransports();
