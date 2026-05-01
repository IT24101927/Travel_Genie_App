const PLACE_TYPES = [
  'Temple',
  'Beach',
  'Nature',
  'Heritage',
  'Museum',
  'Safari',
  'Wildlife',
  'Garden',
  'Lake',
  'Market',
  'Viewpoint',
  'Culture',
  'Adventure',
  'Park',
  'Shopping',
  'Theme Park',
];

const TYPE_BY_KEY = new Map(
  PLACE_TYPES.map((type) => [type.toLowerCase(), type])
);

const TYPE_ALIASES = new Map([
  ['all types', ''],
  ['mixed', ''],
  ['attraction', 'Culture'],
  ['pilgrimage', 'Temple'],
  ['religious', 'Temple'],
  ['religious site', 'Temple'],
  ['nature reserve', 'Nature'],
  ['forest reserve', 'Nature'],
  ['national park', 'Nature'],
  ['archaeological site', 'Heritage'],
  ['monument', 'Heritage'],
  ['memorial', 'Heritage'],
  ['gallery', 'Museum'],
  ['artwork', 'Culture'],
  ['art', 'Culture'],
  ['art gallery', 'Museum'],
  ['zoo', 'Wildlife'],
  ['aquarium', 'Wildlife'],
  ['historical', 'Heritage'],
  ['history', 'Heritage'],
  ['cultural', 'Culture'],
  ['beaches', 'Beach'],
  ['mountains', 'Nature'],
  ['scenic', 'Viewpoint'],
]);

const lower = (value) => String(value || '').trim().toLowerCase();

const normalizePlaceType = (value, fallback = '') => {
  const key = lower(value);
  if (!key) return fallback;
  if (TYPE_BY_KEY.has(key)) return TYPE_BY_KEY.get(key);
  if (TYPE_ALIASES.has(key)) return TYPE_ALIASES.get(key);
  return fallback;
};

const getSearchText = (row = {}, tagNames = []) => [
  row.name,
  row.description,
  row.address_text,
  row.location,
  ...tagNames,
].join(' ').toLowerCase();

const inferWebsiteType = (row = {}, tagNames = []) => {
  for (const tagName of tagNames) {
    const tagType = normalizePlaceType(tagName);
    if (tagType) return tagType;
  }

  const text = getSearchText(row, tagNames);
  if (/\b(temple|vihara|stupa|bodhiya|dagoba|mosque|church|basilica|cathedral|shrine|kovil|devalaya|dewale)\b/.test(text)) return 'Temple';
  if (/\b(beach|bay|lagoon|coast|sea|ocean)\b/.test(text)) return 'Beach';
  if (/\b(museum|gallery)\b/.test(text)) return 'Museum';
  if (/\b(safari|game drive)\b/.test(text)) return 'Safari';
  if (/\b(wildlife|zoo|aquarium|animal|elephant|leopard|bird)\b/.test(text)) return 'Wildlife';
  if (/\b(garden|botanical|arboretum)\b/.test(text)) return 'Garden';
  if (/\b(lake|tank|reservoir)\b/.test(text)) return 'Lake';
  if (/\b(market|bazaar)\b/.test(text)) return 'Market';
  if (/\b(viewpoint|view point|lookout|summit|peak|rock)\b/.test(text)) return 'Viewpoint';
  if (/\b(adventure|hike|hiking|trek|climb|rafting|surf)\b/.test(text)) return 'Adventure';
  if (/\b(park|reserve|sanctuary|forest|wetland|waterfall)\b/.test(text)) return 'Nature';
  if (/\b(shopping|mall|precinct)\b/.test(text)) return 'Shopping';
  if (/\b(theme park|amusement)\b/.test(text)) return 'Theme Park';
  if (/\b(culture|cultural|festival|art|dance|craft)\b/.test(text)) return 'Culture';
  if (/\b(fort|heritage|historical|ancient|archaeological|monument|memorial|ruins|lighthouse|statue|cemetery)\b/.test(text)) return 'Heritage';
  return '';
};

const deriveWebsitePlaceType = (row = {}, tagNames = []) => {
  return normalizePlaceType(row.type || row.category) || inferWebsiteType(row, tagNames);
};

const buildPlaceTagMap = (tagRows = [], placeTagRows = [], allowedTagTypes = ['INTEREST', 'ATTRACTION']) => {
  const allowed = new Set(allowedTagTypes.map((type) => String(type).toUpperCase()));
  const tagsById = new Map();

  tagRows.forEach((row) => {
    const tagId = Number.parseInt(row.tag_id, 10);
    const tagName = String(row.tag_name || '').trim();
    const tagType = String(row.tag_type || '').trim().toUpperCase();
    if (!Number.isFinite(tagId) || !tagName || !allowed.has(tagType)) return;
    tagsById.set(tagId, { name: tagName, type: tagType });
  });

  const weightedTagsByPlace = new Map();
  placeTagRows.forEach((row) => {
    const placeId = Number.parseInt(row.place_id, 10);
    const tagId = Number.parseInt(row.tag_id, 10);
    const tag = tagsById.get(tagId);
    if (!Number.isFinite(placeId) || !tag) return;

    if (!weightedTagsByPlace.has(placeId)) {
      weightedTagsByPlace.set(placeId, []);
    }
    weightedTagsByPlace.get(placeId).push({
      id: tagId,
      name: tag.name,
      weight: Number.parseFloat(row.weight) || 0,
    });
  });

  const tagNamesByPlace = new Map();
  weightedTagsByPlace.forEach((weightedTags, placeId) => {
    const seen = new Set();
    const names = weightedTags
      .sort((a, b) => (b.weight - a.weight) || (a.id - b.id))
      .map((tag) => tag.name)
      .filter((name) => {
        const key = lower(name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    tagNamesByPlace.set(placeId, names);
  });

  return tagNamesByPlace;
};

module.exports = {
  PLACE_TYPES,
  buildPlaceTagMap,
  deriveWebsitePlaceType,
  normalizePlaceType,
};
