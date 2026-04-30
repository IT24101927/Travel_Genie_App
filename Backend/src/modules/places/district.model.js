const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    district_id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    image_url: { type: String, default: '' },
    description: { type: String, default: '' },
    highlights: [{ type: String }],
    best_for: [{ type: String }]
  },
  { timestamps: true }
);

const District = mongoose.models.District || mongoose.model('District', districtSchema);

module.exports = District;