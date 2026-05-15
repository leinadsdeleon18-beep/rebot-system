// src/controllers/adminController.js
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
  try {
    const { role, search, isActive, page = 1, limit = 10 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query).populate('role').limit(limit * 1).skip((page - 1) * limit);
    const total = await User.countDocuments(query);
    
    res.json({ success: true, users, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, fullName, email, role, password, isActive, assignedGrades } = req.body;
    
    console.log('Creating user:', { username, fullName, email, role, assignedGrades });
    
    // Validate required fields
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
    
    // Find the role
    let backendRoleName = role;
    if (role === 'canteen_staff') backendRoleName = 'canteen_staff';
    if (role === 'junk_shop_personnel') backendRoleName = 'junk_shop_personnel';
    if (role === 'administrator') backendRoleName = 'administrator';
    if (role === 'teacher') backendRoleName = 'teacher';
    
    const roleDoc = await Role.findOne({ name: backendRoleName });
    if (!roleDoc) {
      return res.status(400).json({ success: false, message: `Invalid role: ${role}` });
    }
    
    // Hash password manually
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    // Create user with hashed password
    const userData = {
      username,
      fullName,
      email,
      password: hashedPassword, // Use pre-hashed password
      role: roleDoc._id,
      isActive: isActive !== undefined ? isActive : true
    };
    
    // Add assigned grades for teachers
    if (role === 'teacher' && assignedGrades && assignedGrades.length > 0) {
      userData.assignedGrades = assignedGrades;
    }
    
    const user = await User.create(userData);
    
    console.log('User created successfully:', user.username);
    
    // Get the created user with populated role
    const userResponse = await User.findById(user._id).populate('role');
    
    res.status(201).json({ 
      success: true, 
      user: userResponse,
      message: `User ${username} created successfully`
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, email, role, isActive, assignedGrades } = req.body;
    const updateData = { fullName, email, isActive };
    
    if (role) {
      let backendRoleName = role;
      if (role === 'canteen_staff') backendRoleName = 'canteen_staff';
      if (role === 'junk_shop_personnel') backendRoleName = 'junk_shop_personnel';
      if (role === 'administrator') backendRoleName = 'administrator';
      if (role === 'teacher') backendRoleName = 'teacher';
      
      const roleDoc = await Role.findOne({ name: backendRoleName });
      if (roleDoc) updateData.role = roleDoc._id;
    }
    
    if (assignedGrades !== undefined) {
      updateData.assignedGrades = assignedGrades;
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('role');
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, toggleUserStatus };