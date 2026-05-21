const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const authMiddleware = require('../middleware/authMiddleware');

// Get all sections
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sections = await Section.find().populate('adviser', 'fullName email');
    console.log(`📋 Found ${sections.length} sections in database`);
    res.json({ success: true, sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE section (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const { gradeLevel, sectionName, adviser } = req.body;
    
    console.log('📝 Creating section:', { gradeLevel, sectionName, adviser });
    
    // Check if section already exists
    const existingSection = await Section.findOne({ gradeLevel, sectionName });
    if (existingSection) {
      console.log('⚠️ Section already exists:', gradeLevel, sectionName);
      return res.status(400).json({ success: false, message: 'Section already exists' });
    }
    
    const section = await Section.create({ 
      gradeLevel, 
      sectionName, 
      adviser: adviser || null 
    });
    
    console.log('✅ Section created successfully:', section._id);
    
    const populatedSection = await Section.findById(section._id).populate('adviser', 'fullName email');
    
    res.status(201).json({ success: true, section: populatedSection });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE section (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const { gradeLevel, sectionName, adviser } = req.body;
    
    console.log('✏️ Updating section:', req.params.id, { gradeLevel, sectionName, adviser });
    
    const section = await Section.findByIdAndUpdate(
      req.params.id,
      { gradeLevel, sectionName, adviser: adviser || null },
      { new: true, runValidators: true }
    ).populate('adviser', 'fullName email');
    
    if (!section) {
      console.log('❌ Section not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    
    console.log('✅ Section updated successfully:', section._id);
    res.json({ success: true, section });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE section (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    console.log('🗑️ Deleting section:', req.params.id);
    
    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) {
      console.log('❌ Section not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    
    console.log('✅ Section deleted successfully:', section._id);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;