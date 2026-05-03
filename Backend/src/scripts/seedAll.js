const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { connectDatabase } = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const District = require('../modules/places/district.model');
const Place = require('../modules/places/place.model');
const Hotel = require('../modules/hotels/hotel.model');
const { readCsvRows } = require('./csvHelpers');
const { buildPlaceTagMap, deriveWebsitePlaceType } = require('../modules/places/placeTaxonomy');

const createModelFromJson = (modelName, schemaDef) => {
    try {
        if (mongoose.models[modelName]) {
            return mongoose.models[modelName];
        }
        const schema = new mongoose.Schema(schemaDef, { timestamps: true });
        return mongoose.model(modelName, schema);
    } catch (e) {
        console.error(`Error with model ${modelName}:`, e);
        return null;
    }
};

const Tag = createModelFromJson('Tag', {
    tag_id: { type: Number, index: true },
    tag_name: { type: String },
    tag_type: { type: String }
});

const PlaceTag = createModelFromJson('PlaceTag', {
    place_id: { type: Number, index: true },
    tag_id: { type: Number, index: true },
    weight: { type: Number }
});

const seedAll = async () => {
  try {
    await connectDatabase();

    const downloadsDir = 'C:/Users/Kavisha Lakshan/Downloads';
    const districtsCsv = path.join(downloadsDir, 'districts.csv');
    const placesCsv = path.join(downloadsDir, 'places.csv');
    const tagsCsv = path.join(downloadsDir, 'tags.csv');
    const placeTagsCsv = path.join(downloadsDir, 'place_tags.csv');
    const hotelsCsv = path.join(downloadsDir, 'hotels.csv');

    const tagCsvRows = await readCsvRows(tagsCsv);
    const placeTagCsvRows = await readCsvRows(placeTagsCsv);
    const placeTagsById = buildPlaceTagMap(tagCsvRows, placeTagCsvRows);

    console.log('Seeding Districts...');
    await District.deleteMany({});
    const districts = [];
    await new Promise((resolve, reject) => {
        if (!fs.existsSync(districtsCsv)) return resolve();
        fs.createReadStream(districtsCsv)
        .pipe(csv())
        .on('data', (data) => {
            let highlights = [];
            let best_for = [];
            try { highlights = JSON.parse(data.highlights) } catch(e){}
            try { best_for = JSON.parse(data.best_for) } catch(e){}

            districts.push({
                district_id: parseInt(data.district_id),
                name: data.name,
                province: data.province,
                image_url: data.image_url,
                description: data.description,
                highlights: highlights,
                best_for: best_for
            });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    if(districts.length > 0) await District.insertMany(districts);
    console.log('Districts seeded!');

    // Build district_id → name lookup for enriching place records
    const districtNameById = {};
    districts.forEach(d => { districtNameById[d.district_id] = d.name; });

    console.log('Seeding Places...');
    await Place.deleteMany({});
    const places = [];
    await new Promise((resolve, reject) => {
        if (!fs.existsSync(placesCsv)) return resolve();
        fs.createReadStream(placesCsv)
        .pipe(csv())
        .on('data', (data) => {
            if (!data.type || data.type.trim() === '') return;

            const districtIdNum = parseInt(data.district_id);
            const placeIdNum = parseInt(data.place_id);
            const tags = placeTagsById.get(placeIdNum) || [];
            const websiteType = deriveWebsitePlaceType(data, tags);

            // Exclude rows that correspond to hotels/non-destinations (missing type)
            if (!websiteType) return;

            places.push({
                place_id:     placeIdNum,
                district_id:  districtIdNum,
                district:     districtNameById[districtIdNum] || '',  // string name for admin-style queries
                name:         data.name,
                type:         websiteType,
                description:  data.description,
                address_text: data.address_text,
                lat:          parseFloat(data.lat) || 0,
                lng:          parseFloat(data.lng) || 0,
                isActive:     data.isActive !== 'false',
                rating:       parseFloat(data.rating) || 0,
                review_count: parseInt(data.review_count) || 0,
                duration:     data.duration || '',
                image_url:    data.image_url || '',
                tags,
            });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    for (let i = 0; i < places.length; i += 1000) {
        const batch = places.slice(i, i + 1000);
        await Place.insertMany(batch);
    }
    console.log('Places seeded!');
    const placeById = {};
    places.forEach((place) => {
        placeById[place.place_id] = place;
    });

    console.log('Seeding Tags & PlaceTags...');
    if(Tag) await Tag.deleteMany({});
    if(PlaceTag) await PlaceTag.deleteMany({});
    
    const tags = [];
    const placeTags = [];
    
    tagCsvRows.forEach((data) => {
            tags.push({ tag_id: parseInt(data.tag_id), tag_name: data.tag_name, tag_type: data.tag_type });
    });
    if(tags.length > 0) await Tag.insertMany(tags);

    const seededPlaceIds = new Set(places.map((place) => place.place_id));
    
    placeTagCsvRows.forEach((data) => {
        const placeId = parseInt(data.place_id);
        if (!seededPlaceIds.has(placeId)) return;
        placeTags.push({ place_id: placeId, tag_id: parseInt(data.tag_id), weight: parseFloat(data.weight) });
    });
    
    for (let i = 0; i < placeTags.length; i += 5000) {
        await PlaceTag.insertMany(placeTags.slice(i, i + 5000));
    }
    console.log('Tags seeded!');

    console.log('Seeding Hotels...');
    await Hotel.deleteMany({});
    const hotels = [];
    await new Promise((resolve, reject) => {
        if (!fs.existsSync(hotelsCsv)) return resolve();
        fs.createReadStream(hotelsCsv)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
        .on('data', (data) => {
            let parsedAmenities = [];
            let parsedContact = {};
            
            try { if (data.amenities) parsedAmenities = JSON.parse(data.amenities); } catch(e){}
            try { if (data.contact) parsedContact = JSON.parse(data.contact); } catch(e){}
            
            const placeId = parseInt(data.place_id);
            const nearbyPlaceId = (data.nearby_place_id && !isNaN(parseInt(data.nearby_place_id))) ? parseInt(data.nearby_place_id) : null;
            const coordinatePlace = placeById[nearbyPlaceId] || placeById[placeId] || null;

            hotels.push({
                hotel_id: parseInt(data.hotel_id),
                place_id: placeId,
                name: data.name || 'Unknown',
                location: data.address_text || data.location || 'Unknown Location',
                address_text: data.address_text,
                description: data.description,
                hotel_type: data.hotel_type,
                price_per_night: parseFloat(data.price_per_night) || 0,
                star_class: parseInt(data.star_class) || 0,
                amenities: parsedAmenities,
                contact: parsedContact,
                rating: parseFloat(data.rating) || 0,
                review_count: parseInt(data.review_count) || 0,
                nearby_place_id: nearbyPlaceId,
                district_id: coordinatePlace?.district_id || null,
                district: coordinatePlace?.district || '',
                lat: coordinatePlace?.lat ?? null,
                lng: coordinatePlace?.lng ?? null,
                image_url: data.image_url,
            });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    for (let i = 0; i < hotels.length; i += 1000) {
        await Hotel.insertMany(hotels.slice(i, i + 1000));
    }
    console.log('Hotels seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedAll();
