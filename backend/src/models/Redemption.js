const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  reward: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  quantity: { type: Number, required: true, min: 1 },
  pointsUsed: { type: Number, required: true }
});

module.exports = mongoose.model('Redemption', redemptionSchema);