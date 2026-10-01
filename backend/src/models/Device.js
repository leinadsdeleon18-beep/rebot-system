const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId:    { type: String, required: true, unique: true, index: true },
  bottleCount: { type: Number, default: 0, min: 0 },
  lastSeen:    { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);