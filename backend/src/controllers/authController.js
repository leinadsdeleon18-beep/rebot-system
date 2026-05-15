const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '7d' });

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('========================================');
    console.log('LOGIN ATTEMPT:');
    console.log('Username:', username);
    
    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    }).populate('role');
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Log user data for debugging
    console.log('User data found:');
    console.log('  - ID:', user._id);
    console.log('  - Username:', user.username);
    console.log('  - Full Name:', user.fullName);
    console.log('  - Email:', user.email);
    console.log('  - Role name:', user.role?.name);
    console.log('  - isActive:', user.isActive);
    
    // Compare password
    const isValid = await user.comparePassword(password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // NO ACCOUNT DISABLED CHECK - Allow all active users
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role?.name },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful for:', user.username);
    console.log('========================================');
    
    // Return response
    const roleName = user.role?.name || 'administrator';
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: roleName,
        assignedGrades: user.assignedGrades || [],
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const otp = crypto.randomInt(100000, 999999).toString();
    user.passwordResetOTP = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60000);
    await user.save();
    
    console.log(`[DEMO] OTP for ${email}: ${otp}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent', 
      otp: process.env.NODE_ENV === 'development' ? otp : undefined 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    
    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const otp = crypto.randomInt(100000, 999999).toString();
    user.passwordResetOTP = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60000);
    await user.save();
    
    console.log(`[DEMO] New OTP for ${email}: ${otp}`);
    
    res.json({ 
      success: true, 
      message: 'New OTP sent',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.passwordResetOTP !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    console.log(`Password changed for user: ${user.username}`);
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to change password' 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('role');
    res.json({ 
      success: true, 
      user: {
        ...user.toObject(),
        assignedGrades: user.assignedGrades || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  login, 
  requestPasswordReset, 
  verifyOTP,
  resendOTP,
  resetPassword, 
  changePassword, 
  getProfile 
};