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
      ref: 'User',
      default: null
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  });

  // Explicitly set collection name to 'sections'
  sectionSchema.set('collection', 'sections');

  // Create compound index to prevent duplicate sections
  sectionSchema.index({ gradeLevel: 1, sectionName: 1 }, { unique: true });

  module.exports = mongoose.model('Section', sectionSchema);