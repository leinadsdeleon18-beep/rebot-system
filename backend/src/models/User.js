const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
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
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedGrades: [{
    type: String
  }],
  assignedSections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
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

// Auto-set username before save if not provided
userSchema.pre('save', async function(next) {
  // Set username from email if not provided
  if (!this.username && this.email) {
    let username = this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let uniqueUsername = username;
    let counter = 1;
    const User = mongoose.model('User');
    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${username}${counter}`;
      counter++;
    }
    this.username = uniqueUsername;
  }
  
  // Auto-set roleName based on role if not provided
  if (!this.roleName && this.role) {
    try {
      const Role = mongoose.model('Role');
      const roleDoc = await Role.findById(this.role);
      if (roleDoc) {
        this.roleName = roleDoc.name;
      }
    } catch (error) {
      console.error('Error setting roleName:', error);
    }
  }
  
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    if (this.password && this.password.startsWith('$2a$') && this.password.length === 60) {
      return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);