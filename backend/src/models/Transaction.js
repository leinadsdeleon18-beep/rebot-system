const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward'
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  reason: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'adjustment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);