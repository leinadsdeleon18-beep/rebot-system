const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const authMiddleware = require('../middleware/authMiddleware');

// Get all sections
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sections = await Section.find().populate('adviser', 'fullName');
    res.json({ success: true, sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get section by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id).populate('adviser', 'fullName');
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create section (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { gradeLevel, sectionName, adviser } = req.body;
    const section = await Section.create({ gradeLevel, sectionName, adviser });
    res.status(201).json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;