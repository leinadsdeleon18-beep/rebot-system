const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  reward: {
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
  type: {
    type: String,
    enum: ['earn', 'redeem', 'adjustment'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient filtering
transactionSchema.index({ createdAt: 1 });
transactionSchema.index({ student: 1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);