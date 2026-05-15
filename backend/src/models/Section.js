const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  gradeLevel: { 
    type: String, 
    required: true 
  },
  sectionName: { 
    type: String, 
    required: true 
  },
  adviser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { collection: 'section' });

sectionSchema.index({ gradeLevel: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);