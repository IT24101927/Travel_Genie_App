const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { connectDatabase } = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const District = require('../modules/places/district.model');
const Place = require('../modules/places/place.model');

const seedData = async () => {
  try {
    await connectDatabase();

    const districtsCsv = 'C:/Users/Kavisha Lakshan/Downloads/districts.csv';
    const placesCsv = 'C:/Users/Kavisha Lakshan/Downloads/places.csv';

    if (!fs.existsSync(districtsCsv) || !fs.existsSync(placesCsv)) {
        console.error('CSV files not found at downloads directory.');
        process.exit(1);
    }

    console.log('Seeding Districts...');
    await District.deleteMany({});
    const districts = [];
    
    await new Promise((resolve, reject) => {
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
    await District.insertMany(districts);
    console.log('Districts seeded successfully!');

    console.log('Seeding Places...');
    await Place.deleteMany({});
    const places = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(placesCsv)
        .pipe(csv())
        .on('data', (data) => {
            places.push({
                place_id: parseInt(data.place_id),
                district_id: parseInt(data.district_id),
                name: data.name,
                description: data.description,
                address_text: data.address_text,
                lat: parseFloat(data.lat) || 0,
                lng: parseFloat(data.lng) || 0,
                isActive: data.isActive === 'true',
                rating: parseFloat(data.rating) || 0,
                review_count: parseInt(data.review_count) || 0,
                type: data.type || 'Mixed',
                duration: data.duration,
                image_url: data.image_url
            });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // Batch insert places since it might be large
    for (let i = 0; i < places.length; i += 1000) {
        const batch = places.slice(i, i + 1000);
        await Place.insertMany(batch);
    }

    console.log('Places seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
