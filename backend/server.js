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
const esp32Routes = require('./src/routes/esp32Routes');
const canteenRoutes = require('./src/routes/canteenRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const junkShopRoutes = require('./src/routes/junkShopRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const sectionRoutes = require('./src/routes/sectionRoutes');  // ADD THIS LINE

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
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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

app.get('/api/get-rewards', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const rewards = await db.collection('rewards').find().toArray();
    res.json({ success: true, rewards: rewards });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ========== TEST ENDPOINTS ==========
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working properly!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ReBot API is running', timestamp: new Date().toISOString() });
});

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/esp32', esp32Routes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/junk', junkShopRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/sections', sectionRoutes);  // ADD THIS LINE

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Dashboard Stats: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`📍 Login: http://localhost:${PORT}/login`);
});