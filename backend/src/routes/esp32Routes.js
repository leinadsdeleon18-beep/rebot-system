// =====================================================
// ESP8266 / ESP32 ROUTES FOR REBOT  (fixed version)
// - add-points accepts Mongo _id OR studentId (e.g. STU-2026-028)
// - points is parsed as a number (works if ESP sends "7")
// - transaction log + socket emit can no longer cause a 500
// =====================================================

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;

// Build a student filter from a Mongo _id or a studentId/QR string
function studentFilter(idOrCode) {
  const v = String(idOrCode).trim();
  if (ObjectId.isValid(v) && v.length === 24) {
    return { $or: [{ _id: new ObjectId(v) }, { studentId: v }, { qrCode: v }] };
  }
  return { $or: [{ studentId: v }, { qrCode: v }, { rfidCode: v }, { barcode: v }] };
}

// -----------------------------------------------------
// PING
// -----------------------------------------------------
router.get('/ping', (req, res) => {
  console.log('📡 ESP ping received');
  res.json({
    status: 'ok',
    message: 'ESP connected to ReBot server',
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
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    console.log('📥 ESP requesting student list...');
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

    res.json({ success: true, students: formattedStudents });
  } catch (error) {
    console.error('❌ Error getting students:', error);
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    if (!barcode || String(barcode).trim() === '') {
      return res.status(400).json({ success: false, message: 'Barcode / QR code is required' });
    }

    console.log('\n========================================');
    console.log('       QR CODE SCAN RECEIVED');
    console.log('========================================');
    console.log(`Barcode: ${barcode}`);
    console.log(`Student: ${student_name || 'Unknown'}`);
    console.log(`Device: ${device_id || 'Unknown'}`);

    await db.collection('qr_scans').insertOne({
      barcode: barcode,
      studentId: student_id || null,
      studentName: student_name || 'Unknown',
      deviceId: device_id || 'REBOT_ESP',
      deviceType: device_type || 'ESP32',
      timestamp: new Date(),
      type: 'qr_scan',
      source: 'esp'
    });

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('scan-received', {
          type: 'BARCODE_SCAN',
          barcode: barcode,
          studentName: student_name || 'Unknown',
          deviceId: device_id || 'REBOT_ESP',
          timestamp: new Date()
        });
      }
    } catch (e) {
      console.error('⚠️ Emit failed:', e.message);
    }

    console.log('✅ QR scan saved');
    res.json({ success: true, message: 'Barcode saved successfully' });
  } catch (error) {
    console.error('❌ QR scan save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------
// ADD / DEDUCT POINTS
// Body: { studentId, points, reason }
//   studentId: Mongo _id OR studentId string (STU-2026-028)
//   points: positive = add, negative = deduct
// -----------------------------------------------------
router.post('/add-points', async (req, res) => {
  try {
    const { studentId, points, reason } = req.body;
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    if (!studentId || String(studentId).trim() === '') {
      console.log('❌ No student ID provided');
      return res.status(400).json({ success: false, message: 'No student ID provided' });
    }

    const pointsToAdd = Number(points);
    if (!Number.isFinite(pointsToAdd) || pointsToAdd === 0) {
      return res.status(400).json({ success: false, message: 'Points must be a non-zero number' });
    }

    console.log('\n========================================');
    console.log('       ADJUSTING STUDENT POINTS');
    console.log('========================================');
    console.log(`Student ID: ${studentId}`);
    console.log(`Points: ${pointsToAdd > 0 ? '+' : ''}${pointsToAdd}`);
    console.log(`Reason: ${reason || 'QR Scan'}`);

    const student = await db.collection('students').findOne(studentFilter(studentId));

    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const currentPoints = Number(student.points) || 0;
    const newPoints = currentPoints + pointsToAdd;

    if (newPoints < 0) {
      console.log('❌ Insufficient points');
      return res.status(400).json({
        success: false,
        message: 'Insufficient points',
        currentPoints: currentPoints
      });
    }

    const result = await db.collection('students').updateOne(
      { _id: student._id },
      { $set: { points: newPoints, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ Failed to update student points');
      return res.status(500).json({ success: false, message: 'Failed to update student points' });
    }

    // Points are saved. Everything below is non-critical and must never cause a 500.
    try {
      await db.collection('transactions').insertOne({
        transactionNumber: `ESP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        studentId: student._id.toString(),
        studentName: student.fullName || student.name || 'Unknown',
        pointsEarned: pointsToAdd,
        reason: reason || 'QR Scan',
        type: pointsToAdd > 0 ? 'earn' : 'redeem',
        timestamp: new Date(),
        source: 'esp'
      });
    } catch (e) {
      console.error('⚠️ Transaction log failed:', e.message);
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('points-added', {
          type: 'POINTS_ADDED',
          studentId: student._id.toString(),
          studentName: student.fullName || student.name || 'Unknown',
          pointsAdded: pointsToAdd,
          newPoints: newPoints,
          timestamp: new Date()
        });
      }
    } catch (e) {
      console.error('⚠️ Emit failed:', e.message);
    }

    console.log('✅ Points adjusted successfully');
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
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    if (!barcode || barcode.trim() === '') {
      return res.status(400).json({ success: false, message: 'Barcode is required' });
    }

    console.log(`\n🔍 Looking up student: ${barcode}`);

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
      return res.status(404).json({ success: false, message: 'Student not found' });
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------
// HEALTH CHECK
// -----------------------------------------------------
router.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({
    success: connected,
    status: connected ? 'ok' : 'error',
    service: 'ReBot ESP Bridge',
    mongodb: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------
// RECENT QR SCANS
// -----------------------------------------------------
router.get('/scans', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    let limit = parseInt(req.query.limit) || 50;
    if (limit < 1) limit = 1;
    if (limit > 500) limit = 500;

    const scans = await db.collection('qr_scans')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    res.json({ success: true, total: scans.length, scans: scans });
  } catch (error) {
    console.error('❌ Error fetching scans:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;