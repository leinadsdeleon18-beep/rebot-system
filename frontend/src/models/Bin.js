// D:\rebot\backend\src\models\Bin.js
const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: { type: String, required: true, unique: true },
  location: String,
  fillLevel: { type: Number, default: 0, min: 0, max: 100 },
  weight: Number,
  status: { type: String, enum: ['active', 'maintenance', 'full', 'offline'], default: 'active' },
  batteryLevel: { type: Number, default: 100 },
  nonBioLevel: { type: Number, default: 0 },
  bioLevel: { type: Number, default: 0 },
  recycleLevel: { type: Number, default: 0 },
  totalDisposals: { type: Number, default: 0 },
  totalPointsAwarded: { type: Number, default: 0 },
  lastUpdated: Date,
  lastHeartbeat: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bin', binSchema);