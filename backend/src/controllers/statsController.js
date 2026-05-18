const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const Redemption = require('../models/Redemption');
const User = require('../models/User');
const Reward = require('../models/Reward');

const getSystemStats = async (req, res) => {
  try {
    let query = {};
    
    console.log('Stats request - User role:', req.user.role);
    console.log('Stats request - User ID:', req.user.id);
    
    // If user is teacher, only count students from their assigned grades
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      console.log('Teacher assigned grades:', assignedGrades);
      
      if (assignedGrades.length > 0) {
        query = { grade: { $in: assignedGrades } };
      } else {
        // Teacher with no assigned grades sees nothing
        return res.json({
          success: true,
          stats: {
            totalStudents: 0,
            totalPoints: 0,
            totalBottles: 0,
            totalRedemptions: 0,
            totalUsers: 0,
            totalRewards: 0
          }
        });
      }
    }
    
    console.log('Stats query:', JSON.stringify(query));
    
    const totalStudents = await Student.countDocuments(query);
    const totalPointsResult = await Student.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    const totalPoints = totalPointsResult[0]?.total || 0;
    const totalUsers = req.user.role === 'administrator' ? await User.countDocuments() : 0;
    const totalRewards = await Reward.countDocuments();
    const totalRedemptions = await Redemption.countDocuments();
    
    console.log('Stats results - Students:', totalStudents, 'Points:', totalPoints);
    
    res.json({
      success: true,
      stats: {
        totalStudents: totalStudents || 0,
        totalPoints: totalPoints || 0,
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
    let query = {};
    
    // If user is teacher, only show transactions for students in their assigned grades
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      if (assignedGrades.length > 0) {
        // Find students in assigned grades
        const students = await Student.find({ grade: { $in: assignedGrades } }).select('_id');
        const studentIds = students.map(s => s._id);
        query.student = { $in: studentIds };
      } else {
        // Teacher with no assigned grades sees nothing
        return res.json({ success: true, transactions: [] });
      }
    }
    
    const transactions = await Transaction.find(query)
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
    let matchStage = {};
    
    // If user is teacher, only show performance for their assigned grades
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      if (assignedGrades.length > 0) {
        matchStage = { grade: { $in: assignedGrades } };
      } else {
        return res.json({ success: true, performance: [] });
      }
    }
    
    const performance = await Student.aggregate([
      { $match: matchStage },
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