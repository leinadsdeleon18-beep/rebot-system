const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const authMiddleware = require('../middleware/authMiddleware');

// Get all rewards
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ pointsRequired: 1 });
    res.json({ success: true, rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get available rewards
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const rewards = await Reward.find({ isAvailable: true }).sort({ pointsRequired: 1 });
    res.json({ success: true, rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create reward
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const reward = new Reward(req.body);
    await reward.save();
    res.status(201).json({ success: true, reward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update reward
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const reward = await Reward.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }
    
    res.json({ success: true, reward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete reward
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const reward = await Reward.findByIdAndDelete(req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }
    
    res.json({ success: true, message: 'Reward deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;