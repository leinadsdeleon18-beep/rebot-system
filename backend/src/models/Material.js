const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['bottle'], required: true },
  unit: { type: String, required: true, default: 'piece' },
  pointsEquivalent: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Material', materialSchema);