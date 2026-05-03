import colors from '../constants/colors';

export const PLACE_TYPE_META = {
  Temple: { emoji: '🛕', icon: 'business', color: '#FF9800', label: 'Temple' },
  Beach: { emoji: '🏖️', icon: 'sunny', color: '#2196F3', label: 'Beach' },
  Nature: { emoji: '🌿', icon: 'leaf', color: '#4CAF50', label: 'Nature' },
  Heritage: { emoji: '🏛️', icon: 'library', color: '#795548', label: 'Heritage' },
  Museum: { emoji: '🏛️', icon: 'school', color: '#9C27B0', label: 'Museum' },
  Safari: { emoji: '🐘', icon: 'compass', color: '#8BC34A', label: 'Safari' },
  Wildlife: { emoji: '🦁', icon: 'paw', color: '#795548', label: 'Wildlife' },
  Garden: { emoji: '🌸', icon: 'flower', color: '#E91E63', label: 'Garden' },
  Lake: { emoji: '🛶', icon: 'boat', color: '#00BCD4', label: 'Lake' },
  Market: { emoji: '🛍️', icon: 'basket', color: '#FFC107', label: 'Market' },
  Viewpoint: { emoji: '🔭', icon: 'telescope', color: '#3498DB', label: 'Viewpoint' },
  Culture: { emoji: '🎭', icon: 'color-palette', color: '#673AB7', label: 'Culture' },
  Adventure: { emoji: '🧗', icon: 'walk', color: '#FF5722', label: 'Adventure' },
  Park: { emoji: '🌳', icon: 'trail-sign', color: '#388E3C', label: 'Park' },
  Shopping: { emoji: '🛒', icon: 'cart', color: '#E91E63', label: 'Shopping' },
  'Theme Park': { emoji: '🎡', icon: 'sparkles', color: '#D32F2F', label: 'Theme Park' },
};

export const PLACE_TYPE_OPTIONS = Object.entries(PLACE_TYPE_META).map(([id, meta]) => ({
  id,
  ...meta,
}));

const TYPE_ALIASES = {
  Attraction: 'Culture',
  'Religious Site': 'Temple',
  'Nature Reserve': 'Nature',
  Monument: 'Heritage',
  'Archaeological Site': 'Heritage',
  Memorial: 'Heritage',
  Artwork: 'Culture',
  Gallery: 'Museum',
  Zoo: 'Wildlife',
  Aquarium: 'Wildlife',
};

export const getKnownPlaceType = (value, fallback = 'Temple') => {
  const raw = String(value || '').trim();
  const normalized = TYPE_ALIASES[raw] || raw;
  return PLACE_TYPE_META[normalized] ? normalized : fallback;
};

export const getPlaceType = (place = {}) => {
  const value = String(place.category || place.type || '').trim();
  return TYPE_ALIASES[value] || value || 'Place';
};

export const getPlaceTypeMeta = (placeOrType = {}) => {
  const type = typeof placeOrType === 'string' ? placeOrType : getPlaceType(placeOrType);
  const normalized = TYPE_ALIASES[type] || type;
  return PLACE_TYPE_META[normalized] || {
    emoji: '📍',
    icon: 'location',
    color: colors.primary,
    label: type || 'Place',
  };
};
