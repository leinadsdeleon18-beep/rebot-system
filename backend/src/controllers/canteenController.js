// src/controllers/canteenController.js
const Student = require('../models/Student');
const Reward = require('../models/Reward');
const RewardInventory = require('../models/RewardInventory');

const verifyStudent = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const student = await Student.findOne({ qrCode }).populate('section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRedemptionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    res.json({
      success: true,
      stats: {
        todayRedemptions: 0,
        todayPoints: 0,
        totalStock: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { verifyStudent, getRedemptionStats };