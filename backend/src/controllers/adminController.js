const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

// Create user
exports.createUser = async (req, res) => {
  try {
    const { username, fullName, email, role, password, isActive, assignedGrades } = req.body;
    
    console.log('Creating user with data:', { username, fullName, email, role });
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
    
    // Find the role by name
    let roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      console.log(`Role "${role}" not found, creating it...`);
      roleDoc = await Role.create({ name: role, permissions: [] });
    }
    
    console.log('Using role:', roleDoc.name, 'with ID:', roleDoc._id);
    
    // Create user with RAW password and roleName
    const userData = {
      username,
      fullName,
      email,
      password: password, // Raw password - pre-save hook will hash it
      role: roleDoc._id,
      roleName: roleDoc.name, // ← CRITICAL: Save the role name directly
      isActive: isActive !== undefined ? isActive : true
    };
    
    // Add assigned grades for teachers
    if (role === 'teacher' && assignedGrades && assignedGrades.length > 0) {
      userData.assignedGrades = assignedGrades;
    }
    
    const user = new User(userData);
    await user.save();
    
    console.log('User created successfully with ID:', user._id);
    console.log('Role name saved:', user.roleName);
    
    // Return user without password
   // In adminController.js when returning user data
const userResponse = user.toObject();
delete userResponse.password;
userResponse.assignedGrades = user.assignedGrades || []; // Make sure this is included
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('role', 'name');
    
    // Format users - use roleName if exists, otherwise get from populated role
    const formattedUsers = users.map(user => {
      const userObj = user.toObject();
      // Use roleName from schema if available, otherwise get from populated role
      userObj.roleName = user.roleName || user.role?.name || 'No role assigned';
      return userObj;
    });
    
    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, assignedGrades } = req.body;
    
    const updateData = { fullName, email };
    
    // If role is being updated, update both role and roleName
    if (role) {
      let roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) {
        roleDoc = await Role.create({ name: role, permissions: [] });
      }
      updateData.role = roleDoc._id;
      updateData.roleName = roleDoc.name; // ← Update roleName too
    }
    
    // Update assigned grades for teachers
    if (assignedGrades !== undefined) {
      updateData.assignedGrades = assignedGrades;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userResponse = user.toObject();
    userResponse.roleName = user.roleName || user.role?.name;
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle user status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};