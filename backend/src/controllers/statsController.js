const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const Redemption = require('../models/Redemption');
const User = require('../models/User');
const Reward = require('../models/Reward');

const getSystemStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalPoints = await Student.aggregate([{ $group: { _id: null, total: { $sum: '$points' } } }]);
    const totalUsers = await User.countDocuments();
    const totalRewards = await Reward.countDocuments();
    const totalRedemptions = await Redemption.countDocuments();
    
    res.json({
      success: true,
      stats: {
        totalStudents: totalStudents || 0,
        totalPoints: totalPoints[0]?.total || 0,
        totalBottles: 0,
        totalRedemptions: totalRedemptions || 0,
        totalUsers: totalUsers || 0,
        totalRewards: totalRewards || 0
      }
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const transactions = await Transaction.find()
      .populate('student', 'fullName')
      .populate('user', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getGradeLevelPerformance = async (req, res) => {
  try {
    const performance = await Student.aggregate([
      {
        $group: {
          _id: '$grade',
          totalStudents: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          averagePoints: { $avg: '$points' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ success: true, performance });
  } catch (error) {
    console.error('Error getting grade performance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBottlesPerGrade = async (req, res) => {
  try {
    // Return empty array for now
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error getting bottles per grade:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getSystemStats, 
  getRecentTransactions, 
  getGradeLevelPerformance,
  getBottlesPerGrade
};