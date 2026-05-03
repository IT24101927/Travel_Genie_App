const HOTEL_FALLBACKS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format',
];

const NAME_KEYWORD_FALLBACKS = [
  { match: /resort|beach|sea|ocean/i, url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format' },
  { match: /villa|bungalow/i, url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format' },
  { match: /lodge|forest|jungle/i, url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format' },
  { match: /boutique|grand|royal/i, url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format' },
  { match: /hostel|backpacker/i, url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format' },
];

const pickKeywordImage = (name) => {
  const value = String(name || '');
  const hit = NAME_KEYWORD_FALLBACKS.find(({ match }) => match.test(value));
  return hit ? hit.url : null;
};

export const getHotelImageCandidates = (hotel = {}) => {
  const candidates = [
    hotel.image_url,
    hotel.thumbnail,
    hotel.coverImage,
    hotel.photo,
    pickKeywordImage(hotel.name),
    ...HOTEL_FALLBACKS,
  ];
  const seen = new Set();

  return candidates.filter((candidate) => {
    const key = String(candidate || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
