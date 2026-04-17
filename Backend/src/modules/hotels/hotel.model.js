const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, index: true },
    priceRange: { type: Number, required: true, min: 0, index: true },
    rating: { type: Number, required: true, min: 0, max: 5, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    amenities: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
