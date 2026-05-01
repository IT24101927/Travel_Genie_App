/**
 * seedPlaces.js
 * Fetches tourist attractions for all 25 Sri Lanka districts via Overpass API,
 * looks up Wikipedia images, and upserts them into the places collection.
 * Preserves existing hotel entries (type === 'Hotel').
 *
 * Usage:  node src/scripts/seedPlaces.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const axios = require('axios');

const District = require('../modules/places/district.model');
const Place = require('../modules/places/place.model');

/* ── District bounding boxes [lat_min, lat_max, lon_min, lon_max] ── */
const DISTRICT_BOUNDS = {
  'Colombo':      [6.80, 6.98, 79.82, 79.92],
  'Gampaha':      [6.98, 7.25, 79.85, 80.18],
  'Kalutara':     [6.35, 6.75, 79.85, 80.22],
  'Kandy':        [7.15, 7.48, 80.55, 80.90],
  'Matale':       [7.35, 7.75, 80.52, 80.90],
  'Nuwara Eliya': [6.78, 7.05, 80.65, 81.05],
  'Galle':        [5.93, 6.20, 80.10, 80.50],
  'Matara':       [5.85, 6.05, 80.45, 80.85],
  'Hambantota':   [6.00, 6.35, 80.85, 81.40],
  'Jaffna':       [9.52, 9.85, 79.88, 80.30],
  'Kilinochchi':  [9.18, 9.55, 80.20, 80.58],
  'Mannar':       [8.72, 9.20, 79.70, 80.18],
  'Vavuniya':     [8.52, 8.96, 80.32, 80.68],
  'Mullaitivu':   [9.10, 9.48, 80.60, 81.05],
  'Batticaloa':   [7.58, 8.08, 81.50, 81.85],
  'Ampara':       [6.98, 7.62, 81.48, 81.95],
  'Trincomalee':  [8.38, 8.82, 81.02, 81.48],
  'Kurunegala':   [7.32, 7.78, 80.12, 80.52],
  'Puttalam':     [7.72, 8.28, 79.60, 80.05],
  'Anuradhapura': [8.02, 8.68, 80.18, 80.58],
  'Polonnaruwa':  [7.78, 8.18, 80.82, 81.28],
  'Badulla':      [6.78, 7.12, 80.88, 81.30],
  'Monaragala':   [6.52, 7.02, 81.18, 81.58],
  'Ratnapura':    [6.52, 6.88, 80.22, 80.72],
  'Kegalle':      [7.08, 7.38, 80.28, 80.58],
};

/* ── Overpass query for a bounding box ── */
function buildOverpassQuery(bbox) {
  const [latMin, latMax, lonMin, lonMax] = bbox;
  const b = `${latMin},${lonMin},${latMax},${lonMax}`;
  return `
[out:json][timeout:40];
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|zoo|artwork|gallery|aquarium|ruins|heritage"](${b});
  node["historic"~"monument|ruins|fort|castle|archaeological_site|memorial|temple"](${b});
  node["natural"~"beach|peak|waterfall|hot_spring|cave_entrance"](${b});
  node["leisure"~"park|nature_reserve|garden"](${b});
  node["amenity"~"place_of_worship"](${b});
);
out body 40;
  `.trim();
}

/* ── Get Wikipedia thumbnail for a place name ── */
async function getWikiImage(name) {
  try {
    const url = 'https://en.wikipedia.org/w/api.php';
    const res = await axios.get(url, {
      params: {
        action: 'query',
        titles: name,
        prop: 'pageimages',
        format: 'json',
        pithumbsize: 500,
        redirects: 1,
      },
      timeout: 8000,
    });
    const pages = res.data?.query?.pages || {};
    for (const page of Object.values(pages)) {
      if (page.thumbnail?.source) return page.thumbnail.source;
    }
  } catch { /* no image */ }
  return '';
}

/* ── Map OSM tags → place type ── */
function resolveType(tags) {
  const t = tags.tourism || tags.historic || tags.natural || tags.leisure || tags.amenity || '';
  const map = {
    attraction: 'Attraction',
    museum: 'Museum',
    viewpoint: 'Viewpoint',
    theme_park: 'Theme Park',
    zoo: 'Zoo',
    aquarium: 'Aquarium',
    artwork: 'Artwork',
    gallery: 'Gallery',
    ruins: 'Heritage',
    heritage: 'Heritage',
    monument: 'Monument',
    fort: 'Heritage',
    castle: 'Heritage',
    archaeological_site: 'Archaeological Site',
    memorial: 'Memorial',
    temple: 'Religious Site',
    beach: 'Beach',
    peak: 'Nature',
    waterfall: 'Nature',
    hot_spring: 'Nature',
    cave_entrance: 'Nature',
    park: 'Park',
    nature_reserve: 'Nature Reserve',
    garden: 'Garden',
    place_of_worship: 'Religious Site',
  };
  return map[t] || 'Attraction';
}

/* ── Sleep helper ── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Main ── */
async function main() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.\n');

  const districts = await District.find().sort({ district_id: 1 });
  if (!districts.length) {
    console.error('No districts found — seed districts first.');
    process.exit(1);
  }

  const maxPlaceDoc = await Place.findOne().sort({ place_id: -1 }).select('place_id');
  let nextId = (maxPlaceDoc?.place_id || 0) + 1;
  let totalAdded = 0;

  const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

  for (const district of districts) {
    const bounds = DISTRICT_BOUNDS[district.name];
    if (!bounds) {
      console.log(`  [SKIP] No bounds defined for "${district.name}"`);
      continue;
    }

    console.log(`\n── ${district.name} (district_id ${district.district_id}) ──`);

    /* Query Overpass */
    let nodes = [];
    try {
      const res = await axios.post(
        OVERPASS_URL,
        buildOverpassQuery(bounds),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 50000 }
      );
      nodes = (res.data?.elements || []).filter(
        (el) => el.type === 'node' && el.tags?.name
      );
      console.log(`  Overpass returned ${nodes.length} named nodes`);
    } catch (err) {
      console.warn(`  Overpass error: ${err.message} — skipping district`);
      await sleep(3000);
      continue;
    }

    /* Filter: keep English or un-tagged names, deduplicate by name */
    const seen = new Set();
    const unique = [];
    for (const node of nodes) {
      const name = node.tags['name:en'] || node.tags.name;
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      unique.push({ name, tags: node.tags, lat: node.lat, lng: node.lon });
    }
    console.log(`  ${unique.length} unique named places after dedup`);

    /* Skip places already in DB for this district (by name, case-insensitive) */
    const existingNames = new Set(
      (await Place.find({ district_id: district.district_id }).select('name'))
        .map((p) => p.name.toLowerCase())
    );

    const toInsert = unique.filter((p) => !existingNames.has(p.name.toLowerCase()));
    console.log(`  ${toInsert.length} new places to insert`);

    /* Insert with Wikipedia image lookup */
    for (const p of toInsert.slice(0, 30)) { // cap at 30 per district
      const imageUrl = await getWikiImage(p.name);
      await sleep(300); // respect Wikipedia rate limit

      const type = resolveType(p.tags);
      const address = p.tags['addr:full'] || p.tags['addr:street'] || district.name;

      try {
        await Place.create({
          place_id: nextId++,
          district_id: district.district_id,
          name: p.name,
          description: p.tags.description || p.tags['description:en'] || '',
          address_text: address,
          lat: p.lat,
          lng: p.lng,
          isActive: true,
          rating: 0,
          review_count: 0,
          type,
          duration: '',
          image_url: imageUrl,
        });
        process.stdout.write('.');
        totalAdded++;
      } catch (err) {
        if (err.code === 11000) {
          process.stdout.write('d'); // duplicate
        } else {
          console.warn(`\n  Insert error for "${p.name}": ${err.message}`);
        }
      }
    }
    console.log(`\n  Done — ${toInsert.slice(0, 30).length} processed`);
    await sleep(1500); // pause between districts
  }

  console.log(`\n✓ Seeding complete. ${totalAdded} new places added.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
