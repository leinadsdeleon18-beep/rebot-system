const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

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
const reportRoutes = require('./src/routes/reportRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const sectionRoutes = require('./src/routes/sectionRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.100.80:3000', 'https://rebot-system.onrender.com', 'https://bibot-64134.web.app', 'https://bibot-64134.firebaseapp.com'],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// Socket connection handler
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bibot';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    console.log(`📊 Database: ${dbName}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(helmet({ contentSecurityPolicy: false, hsts: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.100.80:3000', 'https://rebot-system.onrender.com', 'https://bibot-64134.web.app', 'https://bibot-64134.firebaseapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options(/.*/, cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ========== LOGIN ROUTE ==========
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    const user = await User.findOne({ username }).populate('role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        role: user.role?.name || 'user'
      },
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
        assignedSections: user.assignedSections || [],
        isActive: user.isActive !== false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DASHBOARD API ENDPOINTS ==========
app.get('/api/get-stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const students = await db.collection('students').find().toArray();
    const totalStudents = students.length;
    const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);

    console.log('📊 Dashboard Stats - Students:', totalStudents, 'Points:', totalPoints);

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
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/get-students', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const students = await db.collection('students').find().toArray();
    res.json({ success: true, students: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET SECTIONS ==========
app.get('/api/sections', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    console.log('📋 Fetching all sections...');
    
    const sections = await db.collection('sections').find({}).toArray();
    console.log(`📋 Found ${sections.length} sections in database`);
    
    sections.forEach(s => {
      console.log(`   - ${s.gradeLevel}: ${s.sectionName} (${s._id})`);
    });
    
    res.json({ 
      success: true, 
      sections: sections.map(s => ({
        _id: s._id,
        gradeLevel: s.gradeLevel,
        sectionName: s.sectionName,
        adviser: s.adviser,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching sections:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET STUDENTS WITH SECTION DATA ==========
app.get('/api/students', async (req, res) => {
  try {
    const { search, grade, section, page = 1, limit = 50 } = req.query;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (grade && grade !== 'all') {
      query.grade = grade;
    }

    if (section && section !== 'all') {
      const ObjectId = mongoose.Types.ObjectId;
      if (ObjectId.isValid(section)) {
        query.section = new ObjectId(section);
      } else {
        query.sectionName = section;
      }
    }

    console.log('🔍 Student query:', JSON.stringify(query));

    const students = await db.collection('students')
      .find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .toArray();

    const total = await db.collection('students').countDocuments(query);

    // Get all sections for lookup
    const sections = await db.collection('sections').find({}).toArray();
    console.log(`📚 Found ${sections.length} sections in database`);
    
    const sectionMap = {};
    sections.forEach(s => {
      sectionMap[s._id.toString()] = {
        _id: s._id,
        sectionName: s.sectionName || 'N/A',
        gradeLevel: s.gradeLevel || 'N/A'
      };
    });
    console.log('📚 Section Map keys:', Object.keys(sectionMap));

    // Format students with section data
    const formattedStudents = students.map(student => {
      let sectionName = 'N/A';
      let gradeLevel = student.grade || 'N/A';
      let sectionObj = null;
      let sectionId = student.section || null;
      
      console.log(`🔍 Processing student: ${student.fullName}, section: ${student.section}`);
      
      // If student has a section reference
      if (student.section) {
        const sectionKey = student.section.toString();
        console.log(`   Looking up section: ${sectionKey}`);
        
        if (sectionMap[sectionKey]) {
          sectionName = sectionMap[sectionKey].sectionName || 'N/A';
          gradeLevel = sectionMap[sectionKey].gradeLevel || student.grade || 'N/A';
          sectionObj = {
            _id: student.section,
            sectionName: sectionName,
            gradeLevel: gradeLevel
          };
          console.log(`   ✅ Found section: ${sectionName} (${gradeLevel})`);
        } else {
          console.log(`   ❌ Section not found in map: ${sectionKey}`);
          // Try to find by grade as fallback
          if (student.grade) {
            for (const [key, sec] of Object.entries(sectionMap)) {
              if (sec.gradeLevel === student.grade) {
                sectionName = sec.sectionName;
                sectionObj = {
                  _id: sec._id,
                  sectionName: sec.sectionName,
                  gradeLevel: sec.gradeLevel
                };
                sectionId = sec._id;
                console.log(`   ✅ Found by grade fallback: ${sectionName}`);
                break;
              }
            }
          }
        }
      } else {
        console.log(`   ⚠️ No section reference for student`);
        // Try to find by grade
        if (student.grade) {
          for (const [key, sec] of Object.entries(sectionMap)) {
            if (sec.gradeLevel === student.grade) {
              sectionName = sec.sectionName;
              sectionObj = {
                _id: sec._id,
                sectionName: sec.sectionName,
                gradeLevel: sec.gradeLevel
              };
              sectionId = sec._id;
              console.log(`   ✅ Found by grade: ${sectionName}`);
              break;
            }
          }
        }
      }
      
      // If student has sectionName directly (legacy)
      if (student.sectionName && student.sectionName !== 'N/A') {
        sectionName = student.sectionName;
        console.log(`   Using direct sectionName: ${sectionName}`);
      }

      return {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email || '',
        grade: gradeLevel,
        sectionName: sectionName,
        sectionId: sectionId,
        section: sectionObj,
        points: student.points || 0,
        isActive: student.isActive !== false,
        qrCode: student.qrCode,
        qrCodeData: student.qrCodeData,
        createdAt: student.createdAt
      };
    });

    console.log(`📋 Found ${formattedStudents.length} students with section data`);
    if (formattedStudents.length > 0) {
      console.log('📋 Sample student:', {
        name: formattedStudents[0].fullName,
        section: formattedStudents[0].sectionName,
        sectionObj: formattedStudents[0].section
      });
    }

    res.json({
      success: true,
      students: formattedStudents,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET STUDENT BY ID ==========
app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const ObjectId = mongoose.Types.ObjectId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const student = await db.collection('students').findOne({ _id: new ObjectId(id) });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all sections for lookup
    const sections = await db.collection('sections').find({}).toArray();
    const sectionMap = {};
    sections.forEach(s => {
      sectionMap[s._id.toString()] = {
        _id: s._id,
        sectionName: s.sectionName || 'N/A',
        gradeLevel: s.gradeLevel || 'N/A'
      };
    });

    // Get section info
    let sectionInfo = null;
    let sectionName = 'N/A';
    let gradeLevel = student.grade || 'N/A';
    
    if (student.section) {
      const sectionKey = student.section.toString();
      if (sectionMap[sectionKey]) {
        sectionInfo = {
          _id: student.section,
          sectionName: sectionMap[sectionKey].sectionName,
          gradeLevel: sectionMap[sectionKey].gradeLevel
        };
        sectionName = sectionMap[sectionKey].sectionName || 'N/A';
        gradeLevel = sectionMap[sectionKey].gradeLevel || student.grade || 'N/A';
      }
    }

    if (student.sectionName) {
      sectionName = student.sectionName;
    }

    res.json({
      success: true,
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email || '',
        grade: gradeLevel,
        sectionName: sectionName,
        sectionId: student.section || null,
        section: sectionInfo,
        points: student.points || 0,
        isActive: student.isActive !== false,
        qrCode: student.qrCode,
        qrCodeData: student.qrCodeData,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET STUDENT BY QR CODE ==========
app.get('/api/students/qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const ObjectId = mongoose.Types.ObjectId;

    console.log(`🔍 Looking up student by QR: ${qrCode}`);

    let student = await db.collection('students').findOne({ 
      $or: [
        { qrCode: qrCode },
        { studentId: qrCode },
        { rfidCode: qrCode }
      ]
    });

    if (!student && ObjectId.isValid(qrCode)) {
      student = await db.collection('students').findOne({ _id: new ObjectId(qrCode) });
    }

    if (!student) {
      console.log(`   ❌ Student not found for QR: ${qrCode}`);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all sections for lookup
    const sections = await db.collection('sections').find({}).toArray();
    const sectionMap = {};
    sections.forEach(s => {
      sectionMap[s._id.toString()] = {
        _id: s._id,
        sectionName: s.sectionName || 'N/A',
        gradeLevel: s.gradeLevel || 'N/A'
      };
    });

    let sectionInfo = null;
    let sectionName = 'N/A';
    let gradeLevel = student.grade || 'N/A';
    
    if (student.section) {
      const sectionKey = student.section.toString();
      if (sectionMap[sectionKey]) {
        sectionInfo = {
          _id: student.section,
          sectionName: sectionMap[sectionKey].sectionName,
          gradeLevel: sectionMap[sectionKey].gradeLevel
        };
        sectionName = sectionMap[sectionKey].sectionName || 'N/A';
        gradeLevel = sectionMap[sectionKey].gradeLevel || student.grade || 'N/A';
      }
    }

    if (student.sectionName) {
      sectionName = student.sectionName;
    }

    console.log(`   ✅ Student found: ${student.fullName}`);

    res.json({
      success: true,
      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email || '',
        grade: gradeLevel,
        sectionName: sectionName,
        sectionId: student.section || null,
        section: sectionInfo,
        points: student.points || 0,
        isActive: student.isActive !== false,
        qrCode: student.qrCode,
        qrCodeData: student.qrCodeData
      }
    });
  } catch (error) {
    console.error('Error finding student by QR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== FIX STUDENT SECTIONS ==========
app.post('/api/fix-student-sections', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    console.log('🔧 Fixing student sections...');
    
    // Get all sections
    const sections = await db.collection('sections').find({}).toArray();
    console.log(`📚 Found ${sections.length} sections in database`);
    
    // Log all sections for debugging
    sections.forEach(s => {
      console.log(`   - ${s.gradeLevel}: ${s.sectionName} (${s._id})`);
    });
    
    // Get all students
    const students = await db.collection('students').find({}).toArray();
    console.log(`👨‍🎓 Found ${students.length} students`);
    
    let updated = 0;
    let notFound = 0;
    const updates = [];
    const notFoundList = [];
    
    for (const student of students) {
      // Check if student has a section reference
      if (student.section) {
        const sectionId = student.section.toString();
        const sectionExists = sections.some(s => s._id.toString() === sectionId);
        
        if (!sectionExists) {
          console.log(`⚠️ Student ${student.fullName} has invalid section: ${sectionId}`);
          notFound++;
          notFoundList.push({ student: student.fullName, sectionId, grade: student.grade });
          
          // Find a section by grade
          const matchingSection = sections.find(s => s.gradeLevel === student.grade);
          
          if (matchingSection) {
            // Update student with correct section
            await db.collection('students').updateOne(
              { _id: student._id },
              { $set: { section: matchingSection._id } }
            );
            updated++;
            updates.push({
              student: student.fullName,
              oldSection: sectionId,
              newSection: matchingSection.sectionName,
              grade: student.grade
            });
            console.log(`   ✅ Updated to ${matchingSection.sectionName} (${matchingSection.gradeLevel})`);
          } else {
            // No matching section found - try to find any section with similar name
            const studentSectionName = student.sectionName || '';
            const matchingByName = sections.find(s => 
              studentSectionName && s.sectionName.toLowerCase().includes(studentSectionName.toLowerCase())
            );
            
            if (matchingByName) {
              await db.collection('students').updateOne(
                { _id: student._id },
                { $set: { section: matchingByName._id } }
              );
              updated++;
              updates.push({
                student: student.fullName,
                oldSection: sectionId,
                newSection: matchingByName.sectionName,
                grade: student.grade
              });
              console.log(`   ✅ Updated by name to ${matchingByName.sectionName} (${matchingByName.gradeLevel})`);
            } else {
              console.log(`   ❌ No matching section found for grade: ${student.grade}`);
            }
          }
        }
      } else {
        // Student has no section - try to find by grade
        if (student.grade) {
          const matchingSection = sections.find(s => s.gradeLevel === student.grade);
          if (matchingSection) {
            await db.collection('students').updateOne(
              { _id: student._id },
              { $set: { section: matchingSection._id } }
            );
            updated++;
            updates.push({
              student: student.fullName,
              oldSection: 'none',
              newSection: matchingSection.sectionName,
              grade: student.grade
            });
            console.log(`   ✅ Assigned to ${matchingSection.sectionName} (${matchingSection.gradeLevel})`);
          }
        }
      }
    }
    
    console.log(`✅ Updated ${updated} students`);
    console.log(`⚠️ ${notFound} students had invalid section references`);
    
    res.json({
      success: true,
      message: `Updated ${updated} students`,
      updated,
      notFound,
      updates,
      notFoundList
    });
  } catch (error) {
    console.error('❌ Fix sections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== REWARDS ENDPOINTS ==========
app.get('/api/rewards', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
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
      stockQuantity: reward.stock || reward.quantity || 0,
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

app.get('/api/rewards/inventory', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    console.log('📊 Fetching inventory summary...');

    const rewards = await db.collection('rewards').find({}).toArray();

    const inventory = rewards.map(reward => ({
      _id: reward._id,
      name: reward.name || 'Unnamed',
      stock: reward.stock || reward.quantity || 0,
      stockQuantity: reward.stock || reward.quantity || 0,
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

app.put('/api/rewards/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
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

    const io = req.app.get('io');
    io.emit('reward-updated', {
      type: 'STOCK_UPDATED',
      rewardId: id,
      rewardName: updatedReward.name,
      newStock: stock,
      timestamp: new Date()
    });

    console.log(`   ✅ Stock updated to ${stock}`);

    res.json({ success: true, reward: updatedReward, message: `Stock updated to ${stock}` });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/rewards', async (req, res) => {
  try {
    const { name, description, pointsRequired, stock, category, imageUrl } = req.body;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

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

    const io = req.app.get('io');
    io.emit('reward-created', {
      type: 'REWARD_CREATED',
      rewardId: result.insertedId,
      rewardName: name,
      timestamp: new Date()
    });

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

app.put('/api/rewards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, pointsRequired, stock, category, isActive } = req.body;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const ObjectId = mongoose.Types.ObjectId;

    console.log(`✏️ Updating reward: ${id}`);

    const updateData = {
      name: name,
      description: description || '',
      pointsRequired: pointsRequired,
      points: pointsRequired,
      category: category || 'other',
      updatedAt: new Date()
    };

    if (stock !== undefined) {
      updateData.stock = stock;
      updateData.stockQuantity = stock;
      updateData.quantity = stock;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const result = await db.collection('rewards').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }

    const updatedReward = await db.collection('rewards').findOne({ _id: new ObjectId(id) });

    const io = req.app.get('io');
    io.emit('reward-updated', {
      type: 'REWARD_UPDATED',
      rewardId: id,
      rewardName: name,
      timestamp: new Date()
    });

    console.log(`   ✅ Reward updated`);

    res.json({ success: true, reward: updatedReward, message: 'Reward updated successfully' });
  } catch (error) {
    console.error('Error updating reward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/rewards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const ObjectId = mongoose.Types.ObjectId;

    console.log(`🗑️ Deleting reward: ${id}`);

    const result = await db.collection('rewards').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }

    const io = req.app.get('io');
    io.emit('reward-deleted', {
      type: 'REWARD_DELETED',
      rewardId: id,
      timestamp: new Date()
    });

    console.log(`   ✅ Reward deleted`);

    res.json({ success: true, message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Error deleting reward:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== TRANSACTION REDEMPTION ENDPOINT ==========
app.post('/api/transactions/redeem', async (req, res) => {
  try {
    const { studentId, rewardId } = req.body;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const ObjectId = mongoose.Types.ObjectId;

    console.log('🔄 Processing redemption:', { studentId, rewardId });

    if (!studentId || !rewardId) {
      return res.status(400).json({ success: false, message: 'Student ID and Reward ID are required' });
    }

    const student = await db.collection('students').findOne({ _id: new ObjectId(studentId) });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const reward = await db.collection('rewards').findOne({ _id: new ObjectId(rewardId) });
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    if (reward.isActive === false) {
      return res.status(400).json({ success: false, message: `${reward.name} is currently inactive` });
    }

    const currentStock = reward.stock || reward.stockQuantity || 0;
    if (currentStock <= 0) {
      return res.status(400).json({ success: false, message: `${reward.name} is out of stock` });
    }

    const pointsRequired = reward.pointsRequired || reward.points || 100;
    if (student.points < pointsRequired) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient points. Need ${pointsRequired - student.points} more points.`,
        neededPoints: pointsRequired - student.points
      });
    }

    const newPoints = student.points - pointsRequired;
    await db.collection('students').updateOne(
      { _id: new ObjectId(studentId) },
      { $set: { points: newPoints, updatedAt: new Date() } }
    );

    const newStock = currentStock - 1;
    await db.collection('rewards').updateOne(
      { _id: new ObjectId(rewardId) },
      { $set: { stock: newStock, stockQuantity: newStock, updatedAt: new Date() } }
    );

    const transaction = {
      transactionNumber: `RDM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      studentId: studentId,
      studentName: student.fullName,
      rewardId: rewardId,
      rewardName: reward.name,
      pointsSpent: pointsRequired,
      type: 'redeem',
      status: 'completed',
      createdAt: new Date()
    };
    
    const transactionResult = await db.collection('transactions').insertOne(transaction);

    const io = req.app.get('io');
    io.emit('redemption-completed', {
      type: 'REDEMPTION_COMPLETED',
      studentId: studentId,
      studentName: student.fullName,
      rewardId: rewardId,
      rewardName: reward.name,
      pointsSpent: pointsRequired,
      remainingPoints: newPoints,
      newStock: newStock,
      timestamp: new Date()
    });

    console.log(`✅ Redemption successful: ${student.fullName} redeemed ${reward.name} for ${pointsRequired} points`);
    console.log(`   New points: ${newPoints}, New stock: ${newStock}`);

    res.json({
      success: true,
      message: `${reward.name} redeemed successfully!`,
      remainingPoints: newPoints,
      transaction: { ...transaction, _id: transactionResult.insertedId }
    });
  } catch (error) {
    console.error('Redemption error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET TRANSACTIONS ==========
app.get('/api/transactions', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const { studentId, type, limit = 100 } = req.query;
    const query = {};

    if (studentId) {
      const ObjectId = mongoose.Types.ObjectId;
      query.studentId = ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId;
    }

    if (type) {
      query.type = type;
    }

    const transactions = await db.collection('transactions')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({ success: true, transactions: transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: error.message });
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
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
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

    res.json(formattedStudents);
  } catch (error) {
    console.error('Error in /api/esp32/students:', error);
    res.status(500).json([]);
  }
});

app.post('/api/esp32/scan-barcode', async (req, res) => {
  try {
    const { barcode, student_id, student_name, device_id, device_type } = req.body;
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║           BARCODE SCAN RECEIVED            ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`   Barcode: ${barcode}`);
    console.log(`   Student: ${student_name || 'Unknown'}`);

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

    const io = req.app.get('io');
    io.emit('scan-received', {
      type: 'BARCODE_SCAN',
      barcode: barcode,
      studentName: student_name,
      deviceId: device_id,
      timestamp: new Date()
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
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const ObjectId = mongoose.Types.ObjectId;

    if (!studentId || studentId === '') {
      return res.status(400).json({ success: false, message: 'No student ID provided' });
    }

    console.log(`💰 Adding ${points} point(s) to student: ${studentId}`);

    const result = await db.collection('students').updateOne(
      { _id: new ObjectId(studentId) },
      { $inc: { points: points || 1 } }
    );

    if (result.modifiedCount > 0) {
      const student = await db.collection('students').findOne({ _id: new ObjectId(studentId) });
      console.log(`   ✅ Student now has ${student?.points || 0} total points`);

      await db.collection('transactions').insertOne({
        studentId: studentId,
        studentName: student?.fullName || 'Unknown',
        pointsEarned: points || 1,
        reason: reason || 'QR Scan',
        type: 'earn',
        timestamp: new Date(),
        source: 'esp8266'
      });

      const io = req.app.get('io');
      io.emit('points-added', {
        type: 'POINTS_ADDED',
        studentId: studentId,
        studentName: student?.fullName || 'Unknown',
        pointsAdded: points || 1,
        newPoints: student?.points || 0,
        timestamp: new Date()
      });

      res.json({ success: true, message: 'Points added', newPoints: student?.points || 0 });
    } else {
      console.log(`   ⚠️ Student not found`);
      res.status(404).json({ success: false, message: 'Student not found' });
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
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    console.log(`🔍 Looking up student by barcode: ${barcode}`);

    const student = await db.collection('students').findOne({
      $or: [
        { rfidCode: barcode },
        { barcode: barcode },
        { studentId: barcode },
        { qrCode: barcode }
      ]
    });

    if (student) {
      console.log(`   ✅ Found: ${student.fullName || student.name}`);
      res.json({
        success: true,
        student: {
          id: student._id,
          rfidCode: student.rfidCode,
          name: student.fullName || student.name,
          points: student.points || 0,
          grade: student.grade,
          section: student.section
        }
      });
    } else {
      console.log(`   ❌ Student not found`);
      res.status(404).json({ success: false, message: 'Student not found' });
    }
  } catch (error) {
    console.error('Error finding student:', error);
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
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const { limit = 50 } = req.query;

    const scans = await db.collection('qr_scans')
      .find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({ success: true, total: scans.length, scans: scans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== TEST / HEALTH ENDPOINTS ==========
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working properly!' });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: 'OK', 
    message: 'ReBot API is running', 
    timestamp: new Date().toISOString(),
    database: statusMap[dbStatus] || 'unknown',
    databaseReady: dbStatus === 1
  });
});

// ========== API ROUTE FILES ==========
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/junk', junkShopRoutes);
app.use('/api/reports', reportRoutes);
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
server.listen(PORT, '0.0.0.0', () => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  console.log('\n========================================');
  console.log('🚀 REBOT SERVER RUNNING');
  console.log('========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database Status: ${statusMap[dbStatus] || 'unknown'}`);
  
  if (dbStatus === 1 && mongoose.connection.db) {
    console.log(`📊 Database Name: ${mongoose.connection.db.databaseName}`);
  }
  
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
  console.log(`   PUT    /api/rewards/:id        - Update reward`);
  console.log(`   DELETE /api/rewards/:id        - Delete reward`);
  console.log('\n💰 Redemption Endpoints:');
  console.log(`   POST   /api/transactions/redeem - Process reward redemption`);
  console.log(`   GET    /api/transactions       - Get all transactions`);
  console.log('\n👨‍🎓 Student Endpoints:');
  console.log(`   GET    /api/students           - Get students with section data`);
  console.log(`   GET    /api/students/:id       - Get student by ID`);
  console.log(`   GET    /api/students/qr/:qrCode - Get student by QR code`);
  console.log('\n🌐 Web Endpoints:');
  console.log(`   POST /api/login                - User login`);
  console.log(`   GET  /api/get-stats            - Dashboard stats`);
  console.log(`   GET  /api/get-students         - All students`);
  console.log('========================================\n');
});