import { getPlaceType } from './placeTypes';

const normalize = (value) => String(value || '').trim().toLowerCase();

export const INTEREST_TO_PLACE_TYPE = {
  beaches: 'Beach',
  mountains: 'Nature',
  historical: 'Heritage',
  history: 'Heritage',
  cultural: 'Culture',
  culture: 'Culture',
  adventure: 'Adventure',
  nature: 'Nature',
  wildlife: 'Wildlife',
  religious: 'Temple',
  relax: 'Beach',
  food: 'Market',
  nightlife: 'Culture',
  photography: 'Viewpoint',
  art: 'Museum',
  shopping: 'Shopping',
  spa: 'Nature',
  wellness: 'Nature',
};

export const STYLE_TO_HOTEL_TYPES = {
  adventure: ['lodge', 'camp', 'guesthouse'],
  relax: ['resort', 'villa', 'boutique'],
  culture: ['boutique', 'guesthouse', 'hotel'],
  luxury: ['resort', 'villa', 'boutique', 'hotel'],
  budget: ['guesthouse', 'hostel', 'lodge'],
  family: ['resort', 'hotel', 'apartment'],
  backpacker: ['hostel', 'guesthouse', 'lodge'],
};

export const TRIP_TYPE_TO_INTERESTS = {
  couple: ['photography', 'nature', 'relax'],
  family: ['family', 'relax', 'nature'],
  solo: ['adventure', 'photography', 'culture'],
  friends: ['nightlife', 'adventure', 'food'],
};

export const PREF_TYPE_TO_STYLE = {
  budget: 'budget',
  luxury: 'luxury',
  midrange: 'relax',
  boutique: 'boutique',
  villa: 'relax',
};

export const INTEREST_TO_HOTEL_AMENITIES = {
  beaches: ['beach', 'pool', 'sea view', 'ocean view'],
  relax: ['spa', 'pool', 'massage', 'wellness'],
  food: ['restaurant', 'breakfast', 'bar', 'kitchen'],
  nightlife: ['bar', 'lounge', 'club'],
  family: ['family', 'kids', 'pool', 'playground'],
  adventure: ['gym', 'tour', 'bike', 'hiking'],
  wellness: ['spa', 'yoga', 'sauna', 'wellness'],
  spa: ['spa', 'sauna', 'massage'],
  photography: ['view', 'rooftop', 'balcony'],
  shopping: ['mall', 'shopping', 'shuttle'],
  cultural: ['heritage', 'traditional', 'cultural'],
  historical: ['heritage', 'colonial', 'traditional'],
};

export const getUserInterests = (user) =>
  (Array.isArray(user?.interests) ? user.interests : [])
    .map(normalize)
    .filter(Boolean);

export const getPlannerInterests = (preferences) => {
  const interests = [];
  if (preferences?.tripType) {
    const tripInterests = TRIP_TYPE_TO_INTERESTS[preferences.tripType] || [];
    interests.push(...tripInterests);
  }
  return interests.map(normalize);
};

export const getUserTravelStyle = (user) => normalize(user?.travelStyle);

export const scorePlaceMatch = (place, interests, preferences = null) => {
  const allInterests = [...(interests || [])];
  if (preferences) {
    allInterests.push(...getPlannerInterests(preferences));
  }
  
  const uniqueInterests = Array.from(new Set(allInterests));
  if (!uniqueInterests.length) return { score: 0, reason: '', tags: [] };

  const interestSet = new Set(uniqueInterests);
  const placeTags = Array.isArray(place?.tags) ? place.tags : [];
  const matchedTags = placeTags.filter((t) => interestSet.has(normalize(t)));

  const type = getPlaceType(place);
  const preferredTypes = new Set(
    uniqueInterests.map((i) => INTEREST_TO_PLACE_TYPE[i]).filter(Boolean)
  );
  const typeMatched = preferredTypes.has(type);

  let score = matchedTags.length * 2 + (typeMatched ? 1 : 0);

  let reason = '';
  if (matchedTags.length > 0) {
    reason = `Matches: ${matchedTags.slice(0, 2).join(', ')}`;
  } else if (typeMatched) {
    reason = `Matches your interest: ${type}`;
  }

  return { score, reason, tags: matchedTags };
};

export const scoreHotelMatch = (hotel, interests, travelStyle, preferences = null) => {
  const allInterests = [...(interests || [])];
  let effectiveStyle = travelStyle;

  if (preferences) {
    allInterests.push(...getPlannerInterests(preferences));
    if (preferences.hotelType && preferences.hotelType !== 'any') {
      effectiveStyle = PREF_TYPE_TO_STYLE[preferences.hotelType] || effectiveStyle;
    }
  }

  const uniqueInterests = Array.from(new Set(allInterests));
  if (!uniqueInterests.length && !effectiveStyle) return { score: 0, reason: '', tags: [] };

  const hotelType = normalize(hotel?.hotel_type);
  const amenities = Array.isArray(hotel?.amenities) ? hotel.amenities : [];
  const amenityTokens = amenities.map(normalize);

  let score = 0;
  const reasons = [];
  const matchedTags = [];

  // Travel-style → hotel-type bonus
  const styleTypes = STYLE_TO_HOTEL_TYPES[effectiveStyle] || [];
  if (hotelType && styleTypes.includes(hotelType)) {
    score += 2;
    reasons.push(`Fits your ${effectiveStyle} style`);
  }

  // Interest → amenity bonuses
  const matchedAmenitySet = new Set();
  uniqueInterests.forEach((interest) => {
    const wanted = INTEREST_TO_HOTEL_AMENITIES[interest] || [];
    wanted.forEach((needle) => {
      const hit = amenityTokens.find((a) => a.includes(needle));
      if (hit && !matchedAmenitySet.has(hit)) {
        matchedAmenitySet.add(hit);
        score += 1;
        matchedTags.push(amenities[amenityTokens.indexOf(hit)]);
      }
    });
  });

  if (matchedTags.length > 0) {
    reasons.unshift(`Matches: ${matchedTags.slice(0, 2).join(', ')}`);
  }

  return { score, reason: reasons[0] || '', tags: matchedTags };
};
