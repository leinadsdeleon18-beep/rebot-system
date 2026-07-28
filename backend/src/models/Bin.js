const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: String,
    area: String
  },
  fillLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  temperature: Number,
  weight: Number,
  status: {
    type: String,
    enum: ['active', 'full', 'maintenance', 'offline'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  wasteType: {
    type: String,
    enum: ['general', 'recyclable', 'organic', 'hazardous'],
    default: 'general'
  }
});

binSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);