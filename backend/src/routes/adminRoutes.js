const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Reward = require('../models/Reward');
const Section = require('../models/Section');
const Role = require('../models/Role');
const Device = require('../models/Device');              // <-- ADD THIS
const authMiddleware = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    if (user.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const users = await User.find()
      .select('-password')
      .populate('role', 'name');
    
    const formattedUsers = users.map(u => {
      const userObj = u.toObject();
      if (!userObj.roleName && userObj.role) {
        userObj.roleName = userObj.role.name;
      }
      return userObj;
    });
    
    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get roles (admin only)
router.get('/roles', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    if (user.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const roles = await Role.find();
    res.json({ success: true, roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all sections for assignment (admin only)
router.get('/sections', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    if (user.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const sections = await Section.find()
      .populate('adviser', 'fullName')
      .sort({ gradeLevel: 1, sectionName: 1 });
    res.json({ success: true, sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user (admin only) - FIXED
router.post('/users', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).populate('role');
    if (requester.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const { username, fullName, email, password, role, assignedGrades, assignedSections } = req.body;
    
    console.log('Creating user with data:', { username, fullName, email, role, assignedGrades, assignedSections });
    
    // Validate required fields
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    // Find role by ID or NAME
    let roleDoc = null;
    
    // Check if role is an ObjectId (24 character hex string)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(role);
    
    if (isObjectId) {
      roleDoc = await Role.findById(role);
    }
    
    if (!roleDoc) {
      // Try to find by name
      roleDoc = await Role.findOne({ name: role });
    }
    
    if (!roleDoc) {
      // Create the role if it doesn't exist
      console.log(`Role "${role}" not found, creating it...`);
      roleDoc = await Role.create({ name: role, permissions: [] });
    }
    
    console.log('Using role:', roleDoc.name, 'with ID:', roleDoc._id);
    
    // Create new user with ALL required fields
    const newUser = new User({
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      role: roleDoc._id,
      roleName: roleDoc.name,
      assignedGrades: assignedGrades || [],
      assignedSections: assignedSections || [],
      isActive: true
    });
    
    await newUser.save();
    
    console.log('User created successfully:', newUser.username);
    console.log('Role name saved:', newUser.roleName);
    console.log('Assigned grades:', newUser.assignedGrades);
    console.log('Assigned sections:', newUser.assignedSections);
    
    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      success: true, 
      user: userResponse,
      message: `User ${fullName} created successfully. Username: ${username}`
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (admin only)
router.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).populate('role');
    if (requester.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const { fullName, role, assignedGrades, assignedSections } = req.body;
    const userId = req.params.id;
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updateData = {
      fullName: fullName || targetUser.fullName,
      assignedGrades: assignedGrades !== undefined ? assignedGrades : targetUser.assignedGrades,
      assignedSections: assignedSections !== undefined ? assignedSections : targetUser.assignedSections
    };
    
    if (role && role !== targetUser.roleName) {
      let roleDoc = null;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(role);
      
      if (isObjectId) {
        roleDoc = await Role.findById(role);
      }
      if (!roleDoc) {
        roleDoc = await Role.findOne({ name: role });
      }
      if (!roleDoc) {
        roleDoc = await Role.create({ name: role, permissions: [] });
      }
      updateData.role = roleDoc._id;
      updateData.roleName = roleDoc.name;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name');
    
    res.json({ 
      success: true, 
      user: updatedUser,
      message: `User ${updatedUser.fullName} updated successfully`
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change user password (admin only)
router.put('/users/:id/password', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).populate('role');
    if (requester.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const { password } = req.body;
    const userId = req.params.id;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.password = password;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle user active status
router.patch('/users/:id/toggle-status', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).populate('role');
    if (requester.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const { isActive } = req.body;
    const userId = req.params.id;
    
    if (userId === req.user.id && isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own account' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({ 
      success: true, 
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      user: { id: user._id, fullName: user.fullName, isActive: user.isActive }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).populate('role');
    if (requester.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    const userId = req.params.id;
    
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.assignedSections && user.assignedSections.length > 0) {
      const studentsCount = await Student.countDocuments({ 
        section: { $in: user.assignedSections } 
      });
      if (studentsCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot delete user. They have ${studentsCount} associated students. Reassign students first.` 
        });
      }
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get system stats (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    if (user.role.name !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const totalStudents = await Student.countDocuments();
    const totalRewards = await Reward.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalSections = await Section.countDocuments();
    
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;
    
    const studentsByGrade = await Student.aggregate([
      {
        $lookup: {
          from: 'sections',
          localField: 'section',
          foreignField: '_id',
          as: 'sectionInfo'
        }
      },
      {
        $unwind: '$sectionInfo'
      },
      {
        $group: {
          _id: '$sectionInfo.gradeLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalStudents,
        totalRewards,
        totalUsers,
        totalSections,
        activeUsers,
        inactiveUsers,
        studentsByGrade
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get dashboard overview stats
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    
    if (user.role.name === 'administrator') {
      const totalStudents = await Student.countDocuments();
      const totalRewards = await Reward.countDocuments();
      const totalUsers = await User.countDocuments();
      const totalSections = await Section.countDocuments();
      const totalPoints = await Student.aggregate([
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);
      
      const recentStudents = await Student.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('section', 'sectionName gradeLevel');
      
      return res.json({
        success: true,
        stats: {
          totalStudents,
          totalRewards,
          totalUsers,
          totalSections,
          totalPoints: totalPoints[0]?.total || 0,
          recentStudents
        }
      });
    }
    
    if (user.role.name === 'teacher') {
      const assignedSections = user.assignedSections || [];
      const students = await Student.find({
        section: { $in: assignedSections }
      }).populate('section', 'sectionName gradeLevel');
      
      const totalStudents = students.length;
      const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
      
      const sectionsWithCount = await Section.aggregate([
        { $match: { _id: { $in: assignedSections } } },
        {
          $lookup: {
            from: 'students',
            localField: '_id',
            foreignField: 'section',
            as: 'studentList'
          }
        },
        {
          $project: {
            sectionName: 1,
            gradeLevel: 1,
            studentCount: { $size: '$studentList' },
            totalPoints: { $sum: '$studentList.points' }
          }
        }
      ]);
      
      return res.json({
        success: true,
        stats: {
          totalStudents,
          totalPoints,
          sections: sectionsWithCount
        }
      });
    }
    
    res.json({ success: true, stats: {} });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;