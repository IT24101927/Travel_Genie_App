const PLACE_TYPE_IMAGE_FALLBACKS = {
  Temple: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Kelaniya_temple_01.jpg/640px-Kelaniya_temple_01.jpg',
  'Religious Site': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Kelaniya_temple_01.jpg/640px-Kelaniya_temple_01.jpg',
  Heritage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Sigiriya_%28141688197%29.jpeg/640px-Sigiriya_%28141688197%29.jpeg',
  'Archaeological Site': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Anuradhapura_-_Jetavanaramaya_1.jpg/640px-Anuradhapura_-_Jetavanaramaya_1.jpg',
  Museum: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/SL_Colombo_asv2020-01_img10_National_Museum.jpg/640px-SL_Colombo_asv2020-01_img10_National_Museum.jpg',
  Gallery: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/SL_Colombo_asv2020-01_img10_National_Museum.jpg/640px-SL_Colombo_asv2020-01_img10_National_Museum.jpg',
  Artwork: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/SL_Colombo_asv2020-01_img10_National_Museum.jpg/640px-SL_Colombo_asv2020-01_img10_National_Museum.jpg',
  Monument: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lotus_Tower_Colombo.jpg/640px-Lotus_Tower_Colombo.jpg',
  Memorial: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lotus_Tower_Colombo.jpg/640px-Lotus_Tower_Colombo.jpg',
  Beach: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Unawatuna_beach%2C_Sri_Lanka.jpg/640px-Unawatuna_beach%2C_Sri_Lanka.jpg',
  Nature: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Ravana_ella_falls.jpg/640px-Ravana_ella_falls.jpg',
  'Nature Reserve': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Ravana_ella_falls.jpg/640px-Ravana_ella_falls.jpg',
  Park: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Viharamahadevi_Park_incl._Town_Hall_Colombo.jpg/640px-Viharamahadevi_Park_incl._Town_Hall_Colombo.jpg',
  Garden: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Viharamahadevi_Park_incl._Town_Hall_Colombo.jpg/640px-Viharamahadevi_Park_incl._Town_Hall_Colombo.jpg',
  Viewpoint: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Colombo_-_Galle_Face.jpg/640px-Colombo_-_Galle_Face.jpg',
  Attraction: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gangaramaya_Temple.JPG/640px-Gangaramaya_Temple.JPG',
  'Theme Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gangaramaya_Temple.JPG/640px-Gangaramaya_Temple.JPG',
  Aquarium: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Unawatuna_beach%2C_Sri_Lanka.jpg/640px-Unawatuna_beach%2C_Sri_Lanka.jpg',
  Zoo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Pinnawala_elephant_orphanage_Sri_Lanka.jpg/640px-Pinnawala_elephant_orphanage_Sri_Lanka.jpg',
  Wildlife: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Pinnawala_elephant_orphanage_Sri_Lanka.jpg/640px-Pinnawala_elephant_orphanage_Sri_Lanka.jpg',
  Safari: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Pinnawala_elephant_orphanage_Sri_Lanka.jpg/640px-Pinnawala_elephant_orphanage_Sri_Lanka.jpg',
  Lake: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Bolgoda_lake.JPG/640px-Bolgoda_lake.JPG',
  Adventure: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Ravana_ella_falls.jpg/640px-Ravana_ella_falls.jpg',
  Culture: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Sigiriya_%28141688197%29.jpeg/640px-Sigiriya_%28141688197%29.jpeg',
  Market: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gangaramaya_Temple.JPG/640px-Gangaramaya_Temple.JPG',
  Shopping: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lotus_Tower_Colombo.jpg/640px-Lotus_Tower_Colombo.jpg',
  default: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Sigiriya_%28141688197%29.jpeg/640px-Sigiriya_%28141688197%29.jpeg',
};

export const getPlaceImageCandidates = (place = {}) => {
  const type = place.category || place.type || '';
  const candidates = [
    place.image_url,
    place.image,
    place.thumbnail,
    place.coverImage,
    place.photo,
    PLACE_TYPE_IMAGE_FALLBACKS[type],
    PLACE_TYPE_IMAGE_FALLBACKS.default,
  ];
  const seen = new Set();

  return candidates.filter((candidate) => {
    const key = String(candidate || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

