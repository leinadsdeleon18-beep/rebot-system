const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dv6kdcxcn',
  api_key: process.env.CLOUDINARY_API_KEY || '713122791338774',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'OgpwQ95LzfwWvkqKpNp8ufGLvdY'
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rebot/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'limit' }],
    public_id: (req, file) => `user_${req.user.id}_${Date.now()}`
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Get the Cloudinary URL
    const avatarUrl = req.file.path;
    
    // Update user in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({ 
      success: true, 
      avatarUrl: avatarUrl,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete avatar (set to null)
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Delete from Cloudinary if exists
    if (user.avatar) {
      // Extract public ID from URL
      const urlParts = user.avatar.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `rebot/avatars/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }
    
    // Update user
    user.avatar = null;
    await user.save();
    
    res.json({ success: true, message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user profile with avatar
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;