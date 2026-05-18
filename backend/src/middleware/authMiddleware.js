const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    const user = await User.findById(decoded.id).populate('role');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role?.name || user.roleName || 'teacher',
      isActive: user.isActive
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;