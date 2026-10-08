// =====================================================
// ESP8266 / ESP32 ROUTES FOR REBOT
// =====================================================

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// -----------------------------------------------------
// ESP8266 PING
// -----------------------------------------------------
router.get('/ping', (req, res) => {
  console.log('📡 ESP8266 ping received');

  res.json({
    status: 'ok',
    message: 'ESP8266 connected to ReBot server',
    timestamp: new Date().toISOString()
  });
});


// -----------------------------------------------------
// GET ALL STUDENTS
// -----------------------------------------------------
router.get('/students', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    console.log('📥 ESP8266 requesting student list...');

    const students = await db.collection('students').find({}).toArray();

    console.log(`   Found ${students.length} students`);

    const formattedStudents = students.map(student => ({
      id: student._id.toString(),
      rfidCode: student.rfidCode || student.barcode || student.studentId || '',
      name: student.fullName || student.name || 'Unknown',
      points: student.points || student.balance || 0,
      grade: student.grade || '',
      section: student.section || ''
    }));

    res.json({
      success: true,
      students: formattedStudents
    });

  } catch (error) {
    console.error('❌ Error getting students:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// -----------------------------------------------------
// SAVE QR / BARCODE SCAN
// -----------------------------------------------------
router.post('/scan-barcode', async (req, res) => {
  try {
    const { barcode, student_id, student_name, device_id, device_type } = req.body;
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    if (!barcode || barcode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Barcode / QR code is required'
      });
    }

    console.log('');
    console.log('========================================');
    console.log('       QR CODE SCAN RECEIVED');
    console.log('========================================');
    console.log(`Barcode: ${barcode}`);
    console.log(`Student: ${student_name || 'Unknown'}`);
    console.log(`Device: ${device_id || 'Unknown'}`);

    await db.collection('qr_scans').insertOne({
      barcode: barcode,
      studentId: student_id || null,
      studentName: student_name || 'Unknown',
      deviceId: device_id || 'REBOT_ESP8266',
      deviceType: device_type || 'ESP8266',
      timestamp: new Date(),
      type: 'qr_scan',
      source: 'esp8266'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('scan-received', {
        type: 'BARCODE_SCAN',
        barcode: barcode,
        studentName: student_name || 'Unknown',
        deviceId: device_id || 'REBOT_ESP8266',
        timestamp: new Date()
      });
    }

    console.log('✅ QR scan saved');

    res.json({
      success: true,
      message: 'Barcode saved successfully'
    });

  } catch (error) {
    console.error('❌ QR scan save error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// -----------------------------------------------------
// ADD / DEDUCT POINTS
// -----------------------------------------------------
// ESP sends:
// POST /api/esp32/add-points
//
// Body:
// {
//   "studentId": "STUDENT_MONGODB_ID",
//   "points": 1,           // positive = add, negative = deduct
//   "reason": "Bottle recycling"
// }
//
// Response:
// {
//   "success": true,
//   "message": "Points added",
//   "newPoints": 42,
//   "pointsAdded": 1
// }
// -----------------------------------------------------
router.post('/add-points', async (req, res) => {
  try {
    const { studentId, points, reason } = req.body;
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    // Validate student ID
    if (!studentId || studentId.trim() === '') {
      console.log('❌ No student ID provided');
      return res.status(400).json({
        success: false,
        message: 'No student ID provided'
      });
    }

    const ObjectId = mongoose.Types.ObjectId;

    if (!ObjectId.isValid(studentId)) {
      console.log(`❌ Invalid student ID: ${studentId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    // Allow negative (deduct) and positive (add), but not 0
    const pointsToAdd = Number(points);

    if (!Number.isFinite(pointsToAdd) || pointsToAdd === 0) {
      return res.status(400).json({
        success: false,
        message: 'Points must be a non-zero number'
      });
    }

    console.log('');
    console.log('========================================');
    console.log('       ADJUSTING STUDENT POINTS');
    console.log('========================================');
    console.log(`Student ID: ${studentId}`);
    console.log(`Points: ${pointsToAdd > 0 ? '+' : ''}${pointsToAdd}`);
    console.log(`Reason: ${reason || 'QR Scan'}`);

    // Find student
    const student = await db.collection('students').findOne({
      _id: new ObjectId(studentId)
    });

    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const currentPoints = Number(student.points) || 0;
    const newPoints = currentPoints + pointsToAdd;

    // Block negative balance
    if (newPoints < 0) {
      console.log('❌ Insufficient points');
      return res.status(400).json({
        success: false,
        message: 'Insufficient points',
        currentPoints: currentPoints
      });
    }

    // Update student points
    const result = await db.collection('students').updateOne(
      { _id: new ObjectId(studentId) },
      {
        $set: {
          points: newPoints,
          updatedAt: new Date()
        }
      }
    );

    // ⭐ FIXED: use matchedCount, not modifiedCount
    if (result.matchedCount === 0) {
      console.log('❌ Failed to update student points');
      return res.status(500).json({
        success: false,
        message: 'Failed to update student points'
      });
    }

    // Save transaction
    await db.collection('transactions').insertOne({
      studentId: studentId,
      studentName: student.fullName || student.name || 'Unknown',
      pointsEarned: pointsToAdd,
      reason: reason || 'QR Scan',
      type: pointsToAdd > 0 ? 'earn' : 'redeem',
      timestamp: new Date(),
      source: 'esp8266'
    });

    // Real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('points-added', {
        type: 'POINTS_ADDED',
        studentId: studentId,
        studentName: student.fullName || student.name || 'Unknown',
        pointsAdded: pointsToAdd,
        newPoints: newPoints,
        timestamp: new Date()
      });
    }

    console.log(`✅ Points adjusted successfully`);
    console.log(`   Old points: ${currentPoints}`);
    console.log(`   Change: ${pointsToAdd > 0 ? '+' : ''}${pointsToAdd}`);
    console.log(`   New points: ${newPoints}`);
    console.log('========================================');

    res.json({
      success: true,
      message: 'Points adjusted',
      newPoints: newPoints,
      pointsAdded: pointsToAdd
    });

  } catch (error) {
    console.error('❌ Points error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// -----------------------------------------------------
// FIND STUDENT BY QR / BARCODE
// -----------------------------------------------------
router.get('/student/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    if (!barcode || barcode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }

    console.log('');
    console.log(`🔍 Looking up student: ${barcode}`);

    const student = await db.collection('students').findOne({
      $or: [
        { rfidCode: barcode },
        { barcode: barcode },
        { studentId: barcode },
        { qrCode: barcode }
      ]
    });

    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log(`✅ Student found: ${student.fullName || student.name || 'Unknown'}`);

    res.json({
      success: true,
      student: {
        id: student._id,
        rfidCode: student.rfidCode || student.barcode || '',
        name: student.fullName || student.name || 'Unknown',
        points: Number(student.points) || 0,
        grade: student.grade || '',
        section: student.section || '',
        studentId: student.studentId || '',
        qrCode: student.qrCode || ''
      }
    });

  } catch (error) {
    console.error('❌ Student lookup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// -----------------------------------------------------
// ESP8266 HEALTH CHECK
// -----------------------------------------------------
router.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.json({
    success: connected,
    status: connected ? 'ok' : 'error',
    service: 'ReBot ESP8266 Bridge',
    mongodb: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});


// -----------------------------------------------------
// GET RECENT QR SCANS
// -----------------------------------------------------
router.get('/scans', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }

    let limit = parseInt(req.query.limit) || 50;
    if (limit < 1) limit = 1;
    if (limit > 500) limit = 500;

    const scans = await db.collection('qr_scans')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      total: scans.length,
      scans: scans
    });

  } catch (error) {
    console.error('❌ Error fetching scans:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;