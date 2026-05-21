const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const authMiddleware = require('../middleware/authMiddleware');
const { sendOTPEmail, sendPasswordResetConfirmation } = require('../services/emailService');

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('========================================');
    console.log('LOGIN ATTEMPT:');
    console.log('Username:', username);
    
    let user = await User.findOne({ username }).populate('role');
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    let roleName = user.role?.name;
    
    if (!roleName && user.role) {
      const roleDoc = await Role.findById(user.role);
      roleName = roleDoc?.name;
    }
    
    if (!roleName && user.roleName) {
      roleName = user.roleName;
    }
    
    if (!roleName) {
      roleName = 'teacher';
      console.log('⚠️ No role found, defaulting to:', roleName);
    }
    
    console.log('✅ User found:', user.username);
    console.log('Role:', roleName);
    console.log('Is Active:', user.isActive);
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      console.log('❌ User account is disabled');
      return res.status(401).json({ success: false, message: 'Account is disabled. Please contact administrator.' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: roleName },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful for:', username);
    console.log('========================================');
    
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
        assignedSections: user.assignedSections || [],
        avatar: user.avatar || null,
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, roleName } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    let role = await Role.findOne({ name: roleName || 'teacher' });
    if (!role) {
      role = await Role.create({ name: roleName || 'teacher', permissions: [] });
    }
    
    const user = new User({
      username,
      email,
      password: password,
      fullName,
      role: role._id,
      roleName: role.name,
      isActive: true
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: role.name },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: role.name,
        assignedGrades: user.assignedGrades || [],
        assignedSections: user.assignedSections || [],
        avatar: null,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== FORGOT PASSWORD - Send OTP ==========
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Forgot password request for:', email);
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(200).json({ 
        success: true, 
        message: 'If your email is registered, you will receive a password reset OTP.' 
      });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000);
    
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    user.passwordResetOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    
    const emailSent = await sendOTPEmail(user.email, otp, user.fullName);
    
    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Password reset OTP sent to your email.' 
      });
    } else {
      console.error('Failed to send email to:', email);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== VERIFY OTP ==========
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('Verifying OTP for:', email);
    console.log('Received OTP:', otp);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('Stored OTP:', user.passwordResetOTP);
    console.log('OTP Expiry:', user.otpExpiry);
    
    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      resetToken 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== RESEND OTP ==========
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Resend OTP request for:', email);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000);
    
    console.log(`Generated new OTP for ${email}: ${otp}`);
    
    user.passwordResetOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    
    const emailSent = await sendOTPEmail(user.email, otp, user.fullName);
    
    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'New OTP sent to your email.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== RESET PASSWORD ==========
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log('Reset password request received');
    
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.passwordResetOTP = undefined;
    user.otpExpiry = undefined;
    user.password = newPassword;
    await user.save();
    
    console.log('Password reset successfully for:', user.email);
    
    await sendPasswordResetConfirmation(user.email, user.fullName);
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Invalid or expired token' });
  }
});

// ========== CHANGE PASSWORD ==========
router.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== UPDATE PROFILE ==========
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, email, phone, address, bio } = req.body;
    
    const updateData = { 
      fullName, 
      email, 
      phone: phone || '', 
      address: address || '', 
      bio: bio || '' 
    };
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET PROFILE ==========
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findById(decoded.id).select('-password').populate('role');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let roleName = user.role?.name || user.roleName || 'teacher';
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: roleName,
        assignedGrades: user.assignedGrades || [],
        assignedSections: user.assignedSections || [],
        avatar: user.avatar || null,
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== TEST ==========
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth route is working!' });
});

module.exports = router;