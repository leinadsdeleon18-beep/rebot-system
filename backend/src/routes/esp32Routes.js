const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

// ESP32 - RFID Scan endpoint
router.post('/scan', async (req, res) => {
  try {
    const { rfid, action, points = 10 } = req.body;
    
    console.log(`ESP32 Scan: RFID=${rfid}, Action=${action}`);
    
    // Find student by RFID
    const student = await Student.findOne({ rfid: rfid });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        error: 'INVALID_RFID'
      });
    }
    
    let responseMessage = '';
    let newPoints = student.points;
    
    switch(action) {
      case 'check_in':
        // Add points for check-in
        newPoints = student.points + points;
        student.points = newPoints;
        await student.save();
        
        // Create transaction record
        const transaction = new Transaction({
          studentId: student._id,
          pointsEarned: points,
          reason: 'Daily check-in',
          type: 'earn',
          status: 'completed'
        });
        await transaction.save();
        
        responseMessage = `Welcome ${student.name}! You earned ${points} points. Total: ${newPoints}`;
        break;
        
      case 'check_balance':
        responseMessage = `${student.name} has ${student.points} points`;
        break;
        
      case 'deduct_points':
        if (req.body.deductPoints) {
          newPoints = student.points - req.body.deductPoints;
          if (newPoints < 0) {
            return res.status(400).json({
              success: false,
              message: 'Insufficient points',
              error: 'INSUFFICIENT_POINTS'
            });
          }
          student.points = newPoints;
          await student.save();
          responseMessage = `${student.name} spent ${req.body.deductPoints} points. Remaining: ${newPoints}`;
        }
        break;
        
      default:
        responseMessage = `${student.name} - Points: ${student.points}`;
    }
    
    res.json({
      success: true,
      message: responseMessage,
      student: {
        name: student.name,
        points: student.points,
        rfid: student.rfid
      }
    });
    
  } catch (error) {
    console.error('ESP32 route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ESP32 - Register new student via RFID
router.post('/register-rfid', async (req, res) => {
  try {
    const { rfid, name, className } = req.body;
    
    // Check if RFID already exists
    const existingStudent = await Student.findOne({ rfid });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'RFID already registered',
        error: 'RFID_EXISTS'
      });
    }
    
    // Create new student
    const student = new Student({
      name,
      rfid,
      className: className || 'Unassigned',
      points: 0
    });
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Student registered successfully',
      student: {
        id: student._id,
        name: student.name,
        rfid: student.rfid,
        points: student.points
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// ESP32 - Get student info
router.get('/student/:rfid', async (req, res) => {
  try {
    const student = await Student.findOne({ rfid: req.params.rfid });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      student: {
        name: student.name,
        points: student.points,
        className: student.className,
        rfid: student.rfid
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ESP32 - Health check (for device connectivity)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    message: 'ESP32 endpoint is ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;