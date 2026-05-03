const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const District = require('../modules/places/district.model');
const { connectDatabase } = require('../config/db');

const CSV_FILE_PATH = path.join(__dirname, 'data', 'districts.csv');

const seedDistricts = async () => {
  try {
    await connectDatabase();
    console.log('Connected to database.');

    const districts = [];

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv(['district_id', 'name', 'province', 'image_url', 'description', 'highlights', 'best_for']))
      .on('data', (row) => {
        // Skip header if present (checking if district_id is not a number)
        if (isNaN(parseInt(row.district_id))) {
          return;
        }

        try {
          // Parse JSON strings for highlights and best_for
          // They come in like "[""Item 1"",""Item 2""]"
          const highlights = JSON.parse(row.highlights.replace(/""/g, '"'));
          const bestFor = JSON.parse(row.best_for.replace(/""/g, '"'));

          districts.push({
            district_id: parseInt(row.district_id),
            name: row.name,
            province: row.province,
            image_url: row.image_url,
            description: row.description,
            highlights: Array.isArray(highlights) ? highlights : [],
            best_for: Array.isArray(bestFor) ? bestFor : []
          });
        } catch (err) {
          console.error(`Error parsing row ${row.district_id}:`, err.message);
          // Fallback if JSON.parse fails
          districts.push({
            district_id: parseInt(row.district_id),
            name: row.name,
            province: row.province,
            image_url: row.image_url,
            description: row.description,
            highlights: [],
            best_for: []
          });
        }
      })
      .on('end', async () => {
        console.log(`Parsed ${districts.length} districts from CSV.`);

        for (const dist of districts) {
          await District.findOneAndUpdate(
            { district_id: dist.district_id },
            dist,
            { upsert: true, new: true }
          );
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err);
        process.exit(1);
      });

  } catch (error) {
    console.error('Error seeding districts:', error);
    process.exit(1);
  }
};

seedDistricts();
