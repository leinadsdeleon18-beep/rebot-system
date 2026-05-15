const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    enum: ['toy', 'snack', 'privilege', 'voucher', 'other'],
    default: 'other'
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  image: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reward', rewardSchema);