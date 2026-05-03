const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    // Numeric IDs used by seeded data from CSV exports
    place_id: { type: Number, index: true },
    district_id: { type: Number, index: true },

    // String district name — set by admin-created places and by seed script
    district: { type: String, trim: true, index: true, default: '' },

    name: { type: String, required: true, trim: true },

    // `category` used by admin form; `type` used by seeded data — both accepted
    type: { type: String, trim: true, default: '' },

    description: { type: String, default: '' },

    // `image_url` is the primary field for all images
    image_url: { type: String, default: '' },

    address_text: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    duration: { type: String, default: '' },
    estimatedCost: { type: Number, default: 0, min: 0 },
    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const Place = mongoose.models.Place || mongoose.model('Place', placeSchema);

module.exports = Place;
