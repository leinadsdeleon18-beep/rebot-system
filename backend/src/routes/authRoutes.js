const express = require('express');
const { createHash, randomBytes, randomInt } = require('node:crypto');
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

// ========== PASSWORD RECOVERY ==========
const otpLifetime = 10 * 60 * 1000;
const resendDelay = 60 * 1000;
const maxOtpAttempts = 5;
const invalidOtp = 'Invalid or expired code. Check your code or request a new one.';
const invalidResetToken = {
  success: false,
  code: 'RESET_TOKEN_INVALID',
  message: 'The reset session has expired. Request a new code.'
};
const hashResetToken = (token) => createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';

const requestPasswordReset = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const otp = String(randomInt(100000, 1000000));
    const now = Date.now();
    const otpExpiry = new Date(now + otpLifetime);
    const user = await User.findOneAndUpdate(
      { email, otpExpiry: { $not: { $gt: new Date(now + otpLifetime - resendDelay) } } },
      { $set: { passwordResetOTP: otp, otpExpiry, otpAttempts: 0 }, $unset: { resetTokenHash: 1 } }
    );

    if (user && !(await sendOTPEmail(user.email, otp))) {
      await User.updateOne(
        { _id: user._id, passwordResetOTP: otp, otpExpiry },
        { $unset: { passwordResetOTP: 1, otpExpiry: 1, otpAttempts: 1 } }
      );
      return res.status(503).json({
        success: false,
        message: 'We could not send your verification code. Please try again shortly.'
      });
    }

    res.json({
      success: true,
      message: 'If this email is registered, a verification code has been sent.'
    });
  } catch (error) {
    console.error('Password recovery request failed:', error.name);
    res.status(500).json({ success: false, message: 'Could not request a verification code. Please try again.' });
  }
};

router.post('/forgot-password', requestPasswordReset);
router.post('/resend-otp', requestPasswordReset);

router.post('/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp ?? '').trim();
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: invalidOtp });
    }

    const challenge = {
      email,
      otpExpiry: { $gt: new Date() },
      $or: [{ otpAttempts: { $lt: maxOtpAttempts } }, { otpAttempts: { $exists: false } }]
    };
    const tokenSecret = randomBytes(32).toString('hex');
    const user = await User.findOneAndUpdate(
      { ...challenge, passwordResetOTP: otp },
      { $set: { resetTokenHash: hashResetToken(tokenSecret) }, $unset: { passwordResetOTP: 1 } }
    );

    if (!user) {
      await User.updateOne(
        { ...challenge, passwordResetOTP: { $exists: true, $ne: otp } },
        { $inc: { otpAttempts: 1 } }
      );
      return res.status(400).json({ success: false, message: invalidOtp });
    }

    res.json({
      success: true,
      message: 'Verification code accepted',
      resetToken: user._id + '.' + tokenSecret
    });
  } catch (error) {
    console.error('Password recovery verification failed:', error.name);
    res.status(500).json({ success: false, message: 'Could not verify the code. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'Password must be 72 bytes or fewer.' });
    }

    if (typeof token !== 'string' || !/^[a-f0-9]{24}\.[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json(invalidResetToken);
    }

    const [userId, tokenSecret] = token.split('.');
    const reset = { _id: userId, resetTokenHash: hashResetToken(tokenSecret) };
    if (!(await User.exists({ ...reset, otpExpiry: { $gt: new Date() } }))) {
      return res.status(400).json(invalidResetToken);
    }

    // Query updates skip the User model's pre-save password hashing hook.
    const password = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { ...reset, otpExpiry: { $gt: new Date() } },
      { $set: { password }, $unset: { resetTokenHash: 1, otpExpiry: 1, otpAttempts: 1 } }
    );

    if (!user) {
      return res.status(400).json(invalidResetToken);
    }

    res.json({ success: true, message: 'Password reset successfully' });
    sendPasswordResetConfirmation(user.email).catch((error) => {
      console.error('Password reset confirmation failed:', error.name);
    });
  } catch (error) {
    console.error('Password reset failed:', error.name);
    res.status(500).json({ success: false, message: 'Could not reset your password. Please try again.' });
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
