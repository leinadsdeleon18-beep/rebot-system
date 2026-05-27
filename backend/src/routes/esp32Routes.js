const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ========== PING ENDPOINT ==========
router.get('/ping', (req, res) => {
  console.log('📡 ESP8266 ping received');
  res.json({ 
    status: 'ok', 
    message: 'ESP8266 connected to BiBot server',
    timestamp: new Date().toISOString()
  });
});

// ========== GET ALL STUDENTS ==========
router.get('/students', async (req, res) => {
  try {
    console.log('📥 ESP8266 requesting student list...');
    const db = mongoose.connection.db;
    
    const students = await db.collection('students')
      .find({}, {
        projection: {
          _id: 1,
          rfidCode: 1,
          barcode: 1,
          name: 1,
          points: 1,
          grade: 1,
          section: 1
        }
      })
      .limit(200)
      .toArray();
    
    const mappedStudents = students.map(s => ({
      id: s._id.toString(),
      rfidCode: s.rfidCode || s.barcode || "",
      name: s.name || "Unknown",
      points: s.points || 0,
      grade: s.grade || "",
      section: s.section || ""
    }));
    
    console.log(`📤 Sending ${mappedStudents.length} students to ESP8266`);
    res.json(mappedStudents);
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SAVE BARCODE SCAN ==========
router.post('/scan-barcode', async (req, res) => {
  try {
    const { barcode, student_id, student_name, device_type, scan_number } = req.body;
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    BARCODE SCAN RECEIVED                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`   Barcode: ${barcode}`);
    console.log(`   Student: ${student_name || 'Unknown'}`);
    console.log(`   Student ID: ${student_id || 'N/A'}`);
    console.log(`   Device: ${device_type || 'ESP8266'}`);
    console.log(`   Scan #: ${scan_number || 'N/A'}`);
    console.log('════════════════════════════════════════════════════════════\n');
    
    const db = mongoose.connection.db;
    
    const scanRecord = {
      barcode: barcode,
      studentId: student_id,
      studentName: student_name,
      deviceType: device_type || 'ESP8266',
      scanNumber: scan_number,
      timestamp: new Date(),
      type: 'qr_scan',
      source: 'esp8266'
    };
    
    const result = await db.collection('qr_scans').insertOne(scanRecord);
    
    res.json({ 
      success: true, 
      message: 'Barcode saved successfully',
      scan_id: result.insertedId
    });
    
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ADD POINTS TO STUDENT ==========
router.post('/add-points', async (req, res) => {
  try {
    const { studentId, points, reason } = req.body;
    
    if (!studentId || studentId === "") {
      return res.json({ success: false, message: 'No student ID provided' });
    }
    
    console.log(`💰 Adding ${points} point(s) to student: ${studentId}`);
    
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;
    
    const result = await db.collection('students').updateOne(
      { _id: new ObjectId(studentId) },
      { $inc: { points: points || 1 } }
    );
    
    if (result.modifiedCount > 0) {
      const student = await db.collection('students').findOne({ _id: new ObjectId(studentId) });
      console.log(`   ✅ Student now has ${student?.points || 0} total points`);
      
      await db.collection('transactions').insertOne({
        studentId: studentId,
        studentName: student?.name || 'Unknown',
        points: points || 1,
        reason: reason || 'QR Scan',
        type: 'earn',
        timestamp: new Date(),
        source: 'esp8266'
      });
      
      res.json({ 
        success: true, 
        message: 'Points added',
        newPoints: student?.points || 0
      });
    } else {
      console.log(`   ⚠️ Student not found`);
      res.json({ success: false, message: 'Student not found' });
    }
    
  } catch (error) {
    console.error('Points error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET SCAN HISTORY ==========
router.get('/scans', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { limit = 50 } = req.query;
    
    const scans = await db.collection('qr_scans')
      .find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.json({
      success: true,
      total: scans.length,
      scans: scans
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== HEALTH CHECK ==========
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ESP8266 Bridge',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;