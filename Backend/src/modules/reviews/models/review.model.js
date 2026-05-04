const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['place', 'hotel'],
      required: true,
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },
    travelType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'friends', 'business', ''],
      default: ''
    },
    visitDate: {
      type: Date
    },
    wouldRecommend: {
      type: Boolean,
      default: true
    },
    pros: {
      type: [String],
      default: []
    },
    cons: {
      type: [String],
      default: []
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    notHelpfulCount: {
      type: Number,
      default: 0
    },
    helpfulBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isReported: {
      type: Boolean,
      default: false,
      index: true
    },
    reportCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved'
    },
    adminResponse: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
