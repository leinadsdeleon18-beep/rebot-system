const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Reward = require('../models/Reward');
const authMiddleware = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    // Fix: Check for 'administrator' not 'admin'
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const users = await User.find().select('-password').populate('role');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user
router.post('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const { username, fullName, email, role, password, isActive, assignedGrades } = req.body;
    
    // Import the adminController functions
    const adminController = require('../controllers/adminController');
    const tempReq = { body: req.body, params: req.params };
    const tempRes = {
      status: (code) => ({
        json: (data) => {
          res.status(code).json(data);
        }
      }),
      json: (data) => res.json(data)
    };
    
    await adminController.createUser(tempReq, tempRes);
  } catch (error) {
    console.error('Create user route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const adminController = require('../controllers/adminController');
    const tempReq = { body: req.body, params: req.params };
    const tempRes = {
      json: (data) => res.json(data)
    };
    
    await adminController.updateUser(tempReq, tempRes);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const adminController = require('../controllers/adminController');
    const tempReq = { params: req.params };
    const tempRes = {
      json: (data) => res.json(data)
    };
    
    await adminController.deleteUser(tempReq, tempRes);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle user status
router.patch('/users/:id/toggle-status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const adminController = require('../controllers/adminController');
    const tempReq = { params: req.params };
    const tempRes = {
      json: (data) => res.json(data)
    };
    
    await adminController.toggleUserStatus(tempReq, tempRes);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get system stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const totalStudents = await Student.countDocuments();
    const totalRewards = await Reward.countDocuments();
    const totalUsers = await User.countDocuments();
    
    res.json({
      success: true,
      stats: {
        totalStudents,
        totalRewards,
        totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;