const mongoose = require('mongoose');

const rewardInventorySchema = new mongoose.Schema({
  reward: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  lastRestocked: Date,
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'reward_inventory' }); // Explicitly set collection name

rewardInventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RewardInventory', rewardInventorySchema);