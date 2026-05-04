const mongoose = require('mongoose');

const priceRecordSchema = new mongoose.Schema(
  {
    place_id: {
      type: Number,
      index: true
    },
    item_type: {
      type: String,
      enum: ['hotel', 'transport', 'activity'],
      required: true
    },
    category: {
      type: String,
      enum: ['food', 'entertainment', 'shopping', 'amenity', 'other'],
      default: 'other'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    activity_name: {
      type: String,
      trim: true
    },
    recorded_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Virtual to populate Place details via numeric ID
priceRecordSchema.virtual('place', {
  ref: 'Place',
  localField: 'place_id',
  foreignField: 'place_id',
  justOne: true
});

priceRecordSchema.set('toObject', { virtuals: true });
priceRecordSchema.set('toJSON', { virtuals: true });

const PriceRecord = mongoose.model('PriceRecord', priceRecordSchema);

module.exports = PriceRecord;
