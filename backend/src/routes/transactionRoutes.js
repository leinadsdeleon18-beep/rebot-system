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
    const allowedRoles = ['administrator', 'teacher', 'canteen_staff'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Your role cannot award points' });
    }

    const { studentId, points, reason } = req.body;
    const pointsToAdd = Number(points);

    if (!studentId || !Number.isInteger(pointsToAdd) || pointsToAdd <= 0) {
      return res.status(400).json({ success: false, message: 'A student and positive whole-number points are required' });
    }
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    student.points += pointsToAdd;
    student.totalPointsEarned = (student.totalPointsEarned || 0) + pointsToAdd;
    await student.save();
    
    const transaction = new Transaction({
      student: student._id,
      pointsEarned: pointsToAdd,
      description: reason?.trim() || 'Points awarded by QR scan',
      type: 'earn'
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Points added successfully',
      transaction,
      student: {
        id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        grade: student.grade,
        points: student.points
      },
      totalPoints: student.points
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;