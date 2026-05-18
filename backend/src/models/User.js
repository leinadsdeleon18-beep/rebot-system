const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  roleName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedGrades: [{
    type: String
  }],
  lastLogin: {
    type: Date
  },
  passwordResetOTP: String,
  otpExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// FIXED: Only hash if password is not already a bcrypt hash
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check if password is already a bcrypt hash (starts with $2a$ and length 60)
    if (this.password && this.password.startsWith('$2a$') && this.password.length === 60) {
      console.log('⚠️ Password already hashed, skipping pre-save hook');
      return next();
    }
    
    console.log(`🔐 Hashing password for user: ${this.username}`);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);