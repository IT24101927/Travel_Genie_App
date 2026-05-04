/**
 * fetchPlaceImages.js
 * Uses Wikimedia Commons image search per type to build large image pools,
 * then distributes them in rotation for visual variety across all places.
 *
 * Usage: node src/scripts/fetchPlaceImages.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const axios    = require('axios');
const Place    = require('../modules/places/models/place.model');

const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const HEADERS  = { 'User-Agent': 'TravelGenieApp/2.0 (educational-project)', Accept: 'application/json' };
const sleep    = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Commons: search for images by keyword ─────────────────── */
async function commonsImages(query, limit = 80) {
  const images = [];
  let continueParam = {};

  while (images.length < limit) {
    try {
      const res = await axios.get(COMMONS, {
        params: {
          action: 'query',
          generator: 'search',
          gsrsearch: query,
          gsrnamespace: 6,          // File namespace only
          gsrlimit: 50,
          prop: 'imageinfo',
          iiprop: 'url',
          iiurlwidth: 640,
          format: 'json',
          ...continueParam,
        },
        headers: HEADERS,
        timeout: 12000,
      });

      const pages = res.data?.query?.pages || {};
      for (const page of Object.values(pages)) {
        const url = page.imageinfo?.[0]?.thumburl;
        if (url && isPhoto(url)) images.push(url);
      }

      if (res.data?.continue && images.length < limit) {
        continueParam = res.data.continue;
      } else {
        break;
      }
    } catch { break; }

    await sleep(250);
  }

  return [...new Set(images)];
}

/* Filter out SVG, logos, icons, maps, flags */
function isPhoto(url) {
  const low = url.toLowerCase();
  return (
    (low.endsWith('.jpg') || low.endsWith('.jpeg') || low.endsWith('.png') || low.endsWith('.webp')) &&
    !low.includes('flag') &&
    !low.includes('logo') &&
    !low.includes('icon') &&
    !low.includes('map') &&
    !low.includes('svg') &&
    !low.includes('symbol') &&
    !low.includes('coat_of_arms') &&
    !low.includes('emblem')
  );
}

/* ── Hardcoded type → search queries ──────────────────────── */
const TYPE_QUERIES = {
  Temple:      ['Buddhist temple Sri Lanka', 'Hindu temple Sri Lanka', 'stupa Sri Lanka', 'dagoba Sri Lanka'],
  Heritage:    ['heritage site Sri Lanka', 'ancient ruins Sri Lanka', 'colonial Sri Lanka', 'fort Sri Lanka'],
  Viewpoint:   ['waterfall Sri Lanka', 'mountain viewpoint Sri Lanka', 'scenic Sri Lanka', 'landscape Sri Lanka'],
  Museum:      ['museum Sri Lanka', 'national museum Colombo', 'gallery Sri Lanka'],
  Beach:       ['beach Sri Lanka', 'coastal Sri Lanka', 'ocean Sri Lanka', 'sea Sri Lanka'],
  Nature:      ['waterfall Sri Lanka', 'forest Sri Lanka', 'river Sri Lanka', 'nature Sri Lanka'],
  Wildlife:    ['wildlife Sri Lanka', 'elephant Sri Lanka', 'national park Sri Lanka', 'safari Sri Lanka'],
  Safari:      ['safari Sri Lanka', 'elephant Sri Lanka', 'leopard Sri Lanka', 'wildlife park Sri Lanka'],
  Adventure:   ['hiking Sri Lanka', 'trekking Sri Lanka', 'waterfall Sri Lanka'],
  Lake:        ['lake Sri Lanka', 'reservoir Sri Lanka', 'lagoon Sri Lanka'],
  Garden:      ['botanical garden Sri Lanka', 'park Sri Lanka', 'garden Sri Lanka'],
  Culture:     ['culture Sri Lanka', 'festival Sri Lanka', 'tradition Sri Lanka'],
  Market:      ['market Sri Lanka', 'Colombo street', 'bazaar Sri Lanka'],
  Shopping:    ['shopping mall Sri Lanka', 'Colombo building', 'store Sri Lanka'],
  'Theme Park': ['amusement park Sri Lanka', 'water park Sri Lanka'],
  Monument:    ['monument Sri Lanka', 'memorial Sri Lanka', 'statue Sri Lanka'],
  Memorial:    ['memorial Sri Lanka', 'war memorial Sri Lanka', 'monument Sri Lanka'],
  Zoo:         ['zoo Sri Lanka', 'Dehiwala zoo', 'elephant orphanage Sri Lanka'],
  'Nature Reserve': ['nature reserve Sri Lanka', 'forest Sri Lanka', 'wildlife sanctuary Sri Lanka'],
  'Archaeological Site': ['archaeological site Sri Lanka', 'ancient ruins Sri Lanka'],
  'Religious Site': ['religious site Sri Lanka', 'shrine Sri Lanka', 'kovil Sri Lanka'],
};

/* ── Main ──────────────────────────────────────────────────── */
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  const typeCounts = await Place.aggregate([
    { $match: { isActive: true, $or: [{ image_url: '' }, { image_url: null }] } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  if (typeCounts.length === 0) {
    console.log('All places already have images!');
    await mongoose.disconnect();
    return;
  }

  console.log(`Types to process:`);
  typeCounts.forEach((t) => console.log(`  ${(t._id || 'Unknown').padEnd(22)} ${t.count} places`));
  console.log();

  let totalUpdated = 0;

  for (const { _id: type, count } of typeCounts) {
    console.log(`\n${'─'.repeat(58)}`);
    console.log(`Type: "${type}" — ${count} places need images`);

    const queries = TYPE_QUERIES[type] || [`${type} Sri Lanka`, 'Sri Lanka travel'];
    let pool = [];

    for (const q of queries) {
      if (pool.length >= 80) break;
      process.stdout.write(`  Commons search: "${q}"... `);
      const imgs = await commonsImages(q, 80 - pool.length);
      console.log(`${imgs.length} images`);
      pool.push(...imgs);
      await sleep(300);
    }

    pool = [...new Set(pool)];

    if (pool.length === 0) {
      console.log(`  No images found — skipping (type-based fallback still active in mobile).`);
      continue;
    }

    console.log(`  Pool: ${pool.length} unique photos — assigning to ${count} places...`);

    const places = await Place.find({
      isActive: true,
      type,
      $or: [{ image_url: '' }, { image_url: null }],
    }).select('_id');

    const bulkOps = places.map((p, i) => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { image_url: pool[i % pool.length] } },
      },
    }));

    await Place.bulkWrite(bulkOps);
    totalUpdated += places.length;
    console.log(`  ✓ Done`);
  }

  // Also fix Temple variety — if all temples got the same image, redistribute
  console.log(`\n${'─'.repeat(58)}`);
  console.log('Checking Temple image variety...');
  const templeImgGroups = await Place.aggregate([
    { $match: { isActive: true, type: 'Temple', image_url: { $nin: ['', null] } } },
    { $group: { _id: '$image_url', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  const topTempleImg = templeImgGroups[0];
  if (topTempleImg && topTempleImg.count > 500) {
    console.log(`  ${topTempleImg.count} temples share the same image — redistributing...`);
    const queries = TYPE_QUERIES.Temple;
    let pool = [];
    for (const q of queries) {
      if (pool.length >= 100) break;
      const imgs = await commonsImages(q, 40);
      pool.push(...imgs);
      await sleep(300);
    }
    pool = [...new Set(pool)];
    console.log(`  New Temple pool: ${pool.length} images`);

    if (pool.length > 1) {
      const temples = await Place.find({ isActive: true, type: 'Temple' }).select('_id');
      const bulkOps = temples.map((p, i) => ({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { image_url: pool[i % pool.length] } },
        },
      }));
      await Place.bulkWrite(bulkOps);
      console.log(`  ✓ Redistributed ${temples.length} temple images across ${pool.length} unique photos`);
    }
  } else {
    console.log('  Temple images already have good variety.');
  }

  const total   = await Place.countDocuments({ isActive: true });
  const withImg = await Place.countDocuments({ isActive: true, image_url: { $nin: ['', null] } });

  console.log(`\n${'═'.repeat(58)}`);
  console.log(`✓ Updated this run   : ${totalUpdated}`);
  console.log(`Overall coverage     : ${withImg} / ${total} (${((withImg / total) * 100).toFixed(1)}%)`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
