// D:\rebot\backend\src\models\Detection.js
const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  wasteType: { type: String, enum: ['recyclable', 'biodegradable', 'non_biodegradable', 'general'], required: true },
  confidence: { type: Number, default: 0.95 },
  actionTaken: String,
  binId: String,
  itemLabel: String,
  pointsEarned: { type: Number, default: 0 },
  studentId: String,
  timestamp: { type: Date, default: Date.now }
});

detectionSchema.index({ timestamp: -1 });
detectionSchema.index({ studentId: 1 });
detectionSchema.index({ wasteType: 1 });

module.exports = mongoose.model('Detection', detectionSchema);