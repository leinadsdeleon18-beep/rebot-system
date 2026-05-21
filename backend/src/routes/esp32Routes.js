// backend/src/routes/esp32Routes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

// ESP32 QR Code Scan endpoint
router.post('/scan', async (req, res) => {
  try {
    const { qrCode, deviceId } = req.body;
    
    console.log(`📷 ESP32 Scan: QR=${qrCode}, Device=${deviceId}`);
    
    // Find student by QR code
    const student = await Student.findOne({ qrCode: qrCode }).populate('section');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        error: 'INVALID_QR'
      });
    }
    
    // Check if student is active
    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Student account is inactive',
        error: 'INACTIVE_ACCOUNT'
      });
    }
    
    // Return student info (for display on scanner screen)
    res.json({
      success: true,
      message: 'Student found',
      student: {
        id: student._id,
        name: student.fullName,
        points: student.points,
        grade: student.grade,
        section: student.section?.sectionName || 'N/A'
      }
    });
    
  } catch (error) {
    console.error('ESP32 scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ESP32 Add Points endpoint (for bottle recycling)
router.post('/add-points', async (req, res) => {
  try {
    const { qrCode, points, materialType } = req.body;
    
    const student = await Student.findOne({ qrCode: qrCode });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Add points
    const pointsToAdd = points || 10; // Default 10 points per bottle
    student.points += pointsToAdd;
    student.totalPointsEarned += pointsToAdd;
    student.totalBottlesRecycled += 1;
    await student.save();
    
    // Create transaction record
    const transaction = new Transaction({
      studentId: student._id,
      pointsEarned: pointsToAdd,
      reason: `Recycled ${materialType || 'item'}`,
      type: 'earn',
      status: 'completed'
    });
    await transaction.save();
    
    res.json({
      success: true,
      message: `Added ${pointsToAdd} points to ${student.fullName}`,
      student: {
        name: student.fullName,
        points: student.points,
        totalBottles: student.totalBottlesRecycled
      }
    });
    
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ESP32 Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;