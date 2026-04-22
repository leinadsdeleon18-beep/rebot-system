const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
app.use('/uploads', express.static('uploads'));

// MongoDB Connection - FIXED (removed deprecated options)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rebot';

console.log('📡 Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📦 Database:', mongoose.connection.name);
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Make sure your IP is whitelisted in Atlas');
    console.log('   Add 0.0.0.0/0 to Network Access if needed');
});

// Models
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'canteen', 'junk', 'utility'], required: true },
    fullname: String,
    avatar: String,
    enabled: { type: Boolean, default: true },
    school: { type: String, default: 'Patubig ES' }
});

const studentSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    section: { type: String, required: true },
    points: { type: Number, default: 0 },
    qrDataURL: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now }
});

const rewardSchema = new mongoose.Schema({
    name: String,
    points: Number,
    stock: Number,
    icon: String
});

const donationSchema = new mongoose.Schema({
    donor: String,
    amount: Number,
    purpose: String,
    reference: String,
    date: { type: Date, default: Date.now }
});

const inventorySchema = new mongoose.Schema({
    item: String,
    stock: Number,
    threshold: Number
});

const transactionSchema = new mongoose.Schema({
    studentId: String,
    type: String,
    amount: String,
    points: Number,
    status: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);
const Reward = mongoose.model('Reward', rewardSchema);
const Donation = mongoose.model('Donation', donationSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Access denied' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rebot_secret');
        const user = await User.findById(decoded.id);
        if (!user || !user.enabled) return res.status(401).json({ error: 'Invalid user' });
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date(),
        mongodb: dbStatus[dbState] || 'unknown',
        database: mongoose.connection.name || 'not connected'
    });
});

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role, fullname } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role,
            fullname
        });
        
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'rebot_secret');
        res.json({ token, user: { id: user._id, username, role, fullname } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const user = await User.findOne({ username, role });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'rebot_secret');
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                fullname: user.fullname,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Protected Routes
app.get('/api/users', authMiddleware, async (req, res) => {
    const users = await User.find({ school: req.user.school }).select('-password');
    res.json(users);
});

app.get('/api/students/:teacherId?', authMiddleware, async (req, res) => {
    const { teacherId } = req.params;
    const query = teacherId ? { teacherId } : {};
    const students = await Student.find(query);
    res.json(students);
});

app.post('/api/students', authMiddleware, async (req, res) => {
    try {
        const { name, section } = req.body;
        const id = `STU-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        const qrDataURL = await QRCode.toDataURL(id);
        
        const student = new Student({
            id,
            name,
            section,
            qrDataURL,
            teacherId: req.user._id
        });
        
        await student.save();
        res.json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/rewards', authMiddleware, async (req, res) => {
    const rewards = await Reward.find();
    res.json(rewards);
});

app.get('/api/donations', authMiddleware, async (req, res) => {
    const donations = await Donation.find().sort({ date: -1 });
    res.json(donations);
});

app.post('/api/donations', authMiddleware, async (req, res) => {
    const donation = new Donation(req.body);
    await donation.save();
    res.json(donation);
});

app.get('/api/inventory', authMiddleware, async (req, res) => {
    const inventory = await Inventory.find();
    res.json(inventory);
});

app.post('/api/inventory', authMiddleware, async (req, res) => {
    const inventory = new Inventory(req.body);
    await inventory.save();
    res.json(inventory);
});

app.get('/api/transactions', authMiddleware, async (req, res) => {
    const transactions = await Transaction.find().sort({ date: -1 }).limit(50);
    res.json(transactions);
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.json(transaction);
});

// File upload
app.post('/api/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    if (req.file) {
        await User.findByIdAndUpdate(req.user._id, { avatar: `/uploads/${req.file.filename}` });
        res.json({ avatar: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// Serve frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});