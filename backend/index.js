const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup (if you need real-time features)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Update with your frontend URL
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(limiter); // Apply rate limiting

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rebot_db';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB successfully!');
  console.log('📦 Database:', mongoose.connection.name);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  process.exit(1);
});

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// ========== SAMPLE SCHEMAS (Based on your collections) ==========

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'staff'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

// Bin Schema
const binSchema = new mongoose.Schema({
  location: { type: String, required: true },
  type: { type: String, enum: ['plastic', 'paper', 'glass', 'general'], required: true },
  capacity: { type: Number, required: true },
  currentFill: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'maintenance', 'full'], default: 'active' }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  binId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
  type: { type: String, enum: ['deposit', 'redemption'], required: true },
  points: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Bin = mongoose.model('Bin', binSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ========== SAMPLE API ROUTES ==========

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Rebot Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      bins: '/api/bins',
      transactions: '/api/transactions'
    }
  });
});

// Sample users route
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sample bins route
app.get('/api/bins', async (req, res) => {
  try {
    const bins = await Bin.find();
    res.json({ success: true, data: bins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a sample bin (for testing)
app.post('/api/bins', async (req, res) => {
  try {
    const bin = new Bin(req.body);
    await bin.save();
    res.status(201).json({ success: true, data: bin });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== SOCKET.IO CONNECTION (for real-time updates) ==========
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  // Example: Join a room for specific bin updates
  socket.on('join-bin', (binId) => {
    socket.join(`bin-${binId}`);
    console.log(`Client ${socket.id} joined bin-${binId}`);
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});

// Export for testing purposes
module.exports = { app, io };