const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const authMiddleware = require('../middleware/authMiddleware'); // IMPORTANT: Add this

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
        avatar: user.avatar || null,
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
        avatar: null,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      message: 'Password reset token generated',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE PROFILE ENDPOINT - FIXED with authMiddleware
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

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth route is working!' });
});

module.exports = router;