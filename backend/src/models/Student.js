const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  qrCodeData: {
    type: String
  },
  grade: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBottlesRecycled: {
    type: Number,
    default: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);