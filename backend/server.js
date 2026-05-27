const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

// Import models
const User = require('./src/models/User');
const Role = require('./src/models/Role');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const rewardRoutes = require('./src/routes/rewardRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const canteenRoutes = require('./src/routes/canteenRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const junkShopRoutes = require('./src/routes/junkShopRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const sectionRoutes = require('./src/routes/sectionRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bibot';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(helmet({ contentSecurityPolicy: false, hsts: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.100.80:3000', 'https://rebot-system.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  message: 'Too many requests, please try again later.',
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === 'localhost'
});
app.use('/api/', limiter);

// ========== LOGIN ROUTE ==========
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).populate('role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name || 'administrator',
        assignedGrades: user.assignedGrades || [],
        isActive: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DASHBOARD API ENDPOINTS ==========
app.get('/api/get-stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const students = await db.collection('students').find().toArray();
    const totalStudents = students.length;
    const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);

    console.log('Dashboard Stats - Students:', totalStudents, 'Points:', totalPoints);

    res.json({
      success: true,
      totalStudents: totalStudents,
      totalPoints: totalPoints,
      totalBottles: 0,
      totalRedemptions: 0,
      students: students
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/get-students', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const students = await db.collection('students').find().toArray();
    res.json({ success: true, students: students });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ========== REWARDS ENDPOINTS ==========
// NOTE: These inline routes handle /api/rewards directly.
// The rewardRoutes file is mounted at /api/rewards too (below),
// but Express matches these first since they're defined earlier.
// If your rewardRoutes file also defines GET /, GET /inventory, etc.,
// remove the duplicates here OR remove app.use('/api/rewards', rewardRoutes) below.

// GET all rewards
app.get('/api/rewards', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    console.log('📦 Fetching all rewards...');

    let rewards = await db.collection('rewards').find({}).toArray();

    if (!rewards || rewards.length === 0) {
      console.log('   No rewards found in database');
      return res.json({
        success: true,
        rewards: [],
        message: 'No rewards available yet'
      });
    }

    const formattedRewards = rewards.map(reward => ({
      _id: reward._id,
      name: reward.name || 'Unnamed Reward',
      description: reward.description || '',
      pointsRequired: reward.pointsRequired || reward.points || 100,
      stock: reward.stock || reward.quantity || 0,
      stockQuantity: reward.stock || reward.quantity || 0, // alias for frontend compatibility
      category: reward.category || 'other',
      imageUrl: reward.imageUrl || '',
      isActive: reward.isActive !== false
    }));

    console.log(`   ✅ Found ${formattedRewards.length} rewards`);

    res.json({ success: true, rewards: formattedRewards });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET inventory summary — MUST be defined before /api/rewards/:id routes
app.get('/api/rewards/inventory', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    console.log('📊 Fetching inventory summary...');

    const rewards = await db.collection('rewards').find({}).toArray();

    const inventory = rewards.map(reward => ({
      _id: reward._id,
      name: reward.name || 'Unnamed',
      stock: reward.stock || reward.quantity || 0,
      stockQuantity: reward.stock || reward.quantity || 0, // alias for frontend compatibility
      pointsRequired: reward.pointsRequired || reward.points || 100,
      category: reward.category || 'other',
      description: reward.description || '',
      isActive: reward.isActive !== false
    }));

    console.log(`   ✅ Inventory: ${inventory.length} items`);

    res.json({ success: true, inventory: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE reward stock
app.put('/api/rewards/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;

    console.log(`📦 Updating reward ${id} stock to ${stock}`);

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ success: false, error: 'Valid stock quantity is required' });
    }

    const result = await db.collection('rewards').updateOne(
      { _id: new ObjectId(id) },
      { $set: { stock: stock, stockQuantity: stock, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }

    const updatedReward = await db.collection('rewards').findOne({ _id: new ObjectId(id) });

    console.log(`   ✅ Stock updated to ${stock}`);

    res.json({ success: true, reward: updatedReward, message: `Stock updated to ${stock}` });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE new reward
app.post('/api/rewards', async (req, res) => {
  try {
    const { name, description, pointsRequired, stock, category, imageUrl } = req.body;
    const db = mongoose.connection.db;

    console.log(`➕ Creating new reward: ${name}`);

    const newReward = {
      name: name,
      description: description || '',
      pointsRequired: pointsRequired || 100,
      points: pointsRequired || 100,
      stock: stock || 0,
      stockQuantity: stock || 0,
      quantity: stock || 0,
      category: category || 'other',
      imageUrl: imageUrl || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('rewards').insertOne(newReward);

    console.log(`   ✅ Reward created with ID: ${result.insertedId}`);

    res.status(201).json({
      success: true,
      reward: { ...newReward, _id: result.insertedId },
      message: 'Reward created successfully'
    });
  } catch (error) {
    console.error('Error creating reward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE reward
app.delete('/api/rewards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;

    console.log(`🗑️ Deleting reward: ${id}`);

    const result = await db.collection('rewards').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }

    console.log(`   ✅ Reward deleted`);

    res.json({ success: true, message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Error deleting reward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ESP8266 ENDPOINTS ==========

app.get('/api/esp32/ping', (req, res) => {
  console.log('📡 ESP8266 ping received');
  res.json({
    status: 'ok',
    message: 'ESP8266 connected to BiBot server',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/esp32/students', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    console.log('📥 ESP8266 requesting student list...');

    const students = await db.collection('students').find({}).toArray();
    console.log(`   Found ${students.length} students in database`);

    const formattedStudents = students.map(student => ({
      id: student._id.toString(),
      rfidCode: student.rfidCode || student.barcode || student.studentId || '',
      name: student.name || student.fullName || 'Unknown',
      points: student.points || student.balance || 0,
      grade: student.grade || '',
      section: student.section || ''
    }));

    if (formattedStudents.length > 0) {
      console.log(`   First student: ${formattedStudents[0].name} (RFID: ${formattedStudents[0].rfidCode})`);
    }

    res.json(formattedStudents);
  } catch (error) {
    console.error('Error in /api/esp32/students:', error);
    res.json([]);
  }
});

app.post('/api/esp32/scan-barcode', async (req, res) => {
  try {
    const { barcode, student_id, student_name, device_id, device_type } = req.body;

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║           BARCODE SCAN RECEIVED            ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`   Barcode: ${barcode}`);
    console.log(`   Student: ${student_name || 'Unknown'}`);
    console.log(`   Student ID: ${student_id || 'N/A'}`);
    console.log(`   Device: ${device_type || 'ESP8266'}`);

    const db = mongoose.connection.db;

    await db.collection('qr_scans').insertOne({
      barcode: barcode,
      studentId: student_id,
      studentName: student_name,
      deviceId: device_id,
      deviceType: device_type || 'ESP8266',
      timestamp: new Date(),
      type: 'qr_scan',
      source: 'esp8266'
    });

    res.json({ success: true, message: 'Barcode saved successfully' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/esp32/add-points', async (req, res) => {
  try {
    const { studentId, points, reason } = req.body;

    if (!studentId || studentId === '') {
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

      res.json({ success: true, message: 'Points added', newPoints: student?.points || 0 });
    } else {
      console.log(`   ⚠️ Student not found`);
      res.json({ success: false, message: 'Student not found' });
    }
  } catch (error) {
    console.error('Points error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/esp32/student/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const db = mongoose.connection.db;

    console.log(`🔍 Looking up student by barcode: ${barcode}`);

    const student = await db.collection('students').findOne({
      $or: [
        { rfidCode: barcode },
        { barcode: barcode },
        { studentId: barcode }
      ]
    });

    if (student) {
      console.log(`   ✅ Found: ${student.name}`);
      res.json({
        success: true,
        student: {
          id: student._id,
          rfidCode: student.rfidCode,
          name: student.name,
          points: student.points || 0,
          grade: student.grade,
          section: student.section
        }
      });
    } else {
      console.log(`   ❌ Student not found`);
      res.json({ success: false, message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/esp32/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ESP8266 Bridge',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/esp32/scans', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { limit = 50 } = req.query;

    const scans = await db.collection('qr_scans')
      .find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({ success: true, total: scans.length, scans: scans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== TEST / HEALTH ENDPOINTS ==========
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working properly!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ReBot API is running', timestamp: new Date().toISOString() });
});

// ========== API ROUTE FILES ==========
// NOTE: /api/rewards is handled by the inline routes above.
// The rewardRoutes file is intentionally NOT mounted here to avoid conflicts.
// If rewardRoutes has additional routes not covered above (e.g. /api/rewards/:id GET/PUT),
// add them as inline routes above instead.
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/junk', junkShopRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/auth', authRoutes);

// ========== ERROR HANDLERS ==========
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('🚀 REBOT SERVER RUNNING');
  console.log('========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📡 ESP8266 Endpoints:');
  console.log(`   GET  /api/esp32/ping           - Test connection`);
  console.log(`   GET  /api/esp32/students       - Get all students`);
  console.log(`   POST /api/esp32/scan-barcode   - Save barcode scan`);
  console.log(`   POST /api/esp32/add-points     - Add points to student`);
  console.log(`   GET  /api/esp32/student/:code  - Find student by barcode`);
  console.log(`   GET  /api/esp32/health         - Health check`);
  console.log('\n🎁 Rewards Endpoints:');
  console.log(`   GET    /api/rewards            - Get all rewards`);
  console.log(`   GET    /api/rewards/inventory  - Get inventory summary`);
  console.log(`   PUT    /api/rewards/:id/inventory - Update stock`);
  console.log(`   POST   /api/rewards            - Create new reward`);
  console.log(`   DELETE /api/rewards/:id        - Delete reward`);
  console.log('\n🌐 Web Endpoints:');
  console.log(`   POST /login                    - User login`);
  console.log(`   GET  /api/get-stats            - Dashboard stats`);
  console.log(`   GET  /api/get-students         - All students`);
  console.log('========================================\n');
});