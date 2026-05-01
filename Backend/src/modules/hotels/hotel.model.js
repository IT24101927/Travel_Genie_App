const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    hotel_id: { type: Number, index: true },
    place_id: { type: Number, index: true },
    nearby_place_id: { type: Number, index: true },
    district_id: { type: Number, index: true },
    district: { type: String, trim: true, index: true, default: '' },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: false, trim: true, index: true },
    address_text: { type: String, trim: true },
    priceRange: { type: Number, required: false, min: 0, index: true },
    price_per_night: { type: Number, required: false, min: 0, index: true },
    rating: { type: Number, required: false, default: 0, min: 0, max: 5, index: true },
    star_class: { type: Number, required: false, min: 0, max: 5 },
    hotel_type: { type: String, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    image_url: { type: String, default: '' },
    amenities: [{ type: String, trim: true }],
    contact: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      website: { type: String, trim: true }
    },
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
  },
  { timestamps: true }
);

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
