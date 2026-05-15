const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const Reward = require('../models/Reward');
const authMiddleware = require('../middleware/authMiddleware');

// Get all transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('studentId', 'name rfid points')
      .populate('rewardId', 'name pointsRequired')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student transactions
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ studentId: req.params.studentId })
      .populate('rewardId', 'name pointsRequired')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Redeem reward
router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const { studentId, rewardId } = req.body;
    
    const student = await Student.findById(studentId);
    const reward = await Reward.findById(rewardId);
    
    if (!student || !reward) {
      return res.status(404).json({ success: false, message: 'Student or reward not found' });
    }
    
    if (student.points < reward.pointsRequired) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }
    
    if (!reward.isAvailable) {
      return res.status(400).json({ success: false, message: 'Reward is not available' });
    }
    
    // Deduct points
    student.points -= reward.pointsRequired;
    await student.save();
    
    // Create transaction
    const transaction = new Transaction({
      studentId,
      rewardId,
      pointsSpent: reward.pointsRequired,
      status: 'completed'
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      transaction,
      remainingPoints: student.points
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add points (earn points)
router.post('/add-points', authMiddleware, async (req, res) => {
  try {
    const { studentId, points, reason } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Add points
    student.points += points;
    await student.save();
    
    // Create transaction
    const transaction = new Transaction({
      studentId,
      pointsEarned: points,
      reason,
      type: 'earn',
      status: 'completed'
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Points added successfully',
      transaction,
      totalPoints: student.points
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;