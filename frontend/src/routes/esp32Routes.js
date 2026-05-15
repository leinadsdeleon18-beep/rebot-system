const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import models
let Student, Detection;

try {
  Student = require('../models/Student');
} catch (e) {
  const studentSchema = new mongoose.Schema({
    studentId: String,
    fullName: String,
    points: Number,
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' }
  });
  Student = mongoose.model('Student', studentSchema);
}

try {
  Detection = require('../models/Detection');
} catch (e) {
  const detectionSchema = new mongoose.Schema({
    deviceId: String,
    wasteType: String,
    confidence: Number,
    actionTaken: String,
    binId: String,
    itemLabel: String,
    pointsEarned: Number,
    studentId: String,
    timestamp: Date
  });
  Detection = mongoose.model('Detection', detectionSchema);
}

// Get student points for QR verification
router.get('/student/points/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId }).populate('section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({
      success: true,
      studentId: student.studentId,
      studentName: student.fullName,
      currentPoints: student.points || 0,
      pointsToEarn: 5,
      grade: student.section?.gradeLevel || 'N/A',
      section: student.section?.sectionName || 'N/A'
    });
  } catch (error) {
    console.error('Student points error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Award points to student
router.post('/award-points', async (req, res) => {
  try {
    const { studentId, points, deviceId, wasteType } = req.body;
    
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    student.points += points;
    await student.save();
    
    console.log(`💰 Awarded ${points} points to ${student.fullName} (Total: ${student.points})`);
    
    res.json({ 
      success: true, 
      message: `Added ${points} points to ${student.fullName}`,
      newTotal: student.points
    });
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Log detection events
router.post('/detection/log', async (req, res) => {
  try {
    const { deviceId, wasteType, confidence, actionTaken, binId, itemLabel, pointsEarned, studentId } = req.body;
    
    console.log(`📸 Detection: ${wasteType} | ${itemLabel} | Points: ${pointsEarned}`);
    
    const detection = new Detection({
      deviceId: deviceId || 'REBOT_ESP8266_001',
      wasteType: wasteType || 'general',
      confidence: confidence || 0.95,
      actionTaken: actionTaken || 'Diverted to bin',
      binId: binId || 'BIN_PATUBIG_001',
      itemLabel: itemLabel || 'Unknown item',
      pointsEarned: pointsEarned || 0,
      studentId: studentId || null,
      timestamp: new Date()
    });
    
    await detection.save();
    
    res.json({ success: true, message: 'Detection logged' });
  } catch (error) {
    console.error('Detection log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Device health check
router.post('/device/health', async (req, res) => {
  try {
    const { deviceId, batteryLevel, firmwareVersion, uptimeSeconds, freeMemory, wifiStrength, status } = req.body;
    
    console.log(`💓 Heartbeat from ${deviceId} | Battery: ${batteryLevel}% | WiFi: ${wifiStrength}dBm`);
    
    res.json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;