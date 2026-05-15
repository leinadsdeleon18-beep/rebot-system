const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Section = require('../models/Section');
const authMiddleware = require('../middleware/authMiddleware');

// Get all students
router.get('/', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find().populate('section').sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single student
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('section');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student by QR code
router.get('/qr/:qrCode', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ qrCode: req.params.qrCode }).populate('section');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create student - Admin and Teacher can create
router.post('/', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { fullName, email, grade, section, phone } = req.body;
    
    // Find or create section
    let sectionDoc = await Section.findOne({ gradeLevel: grade, sectionName: section });
    if (!sectionDoc) {
      sectionDoc = await Section.create({ gradeLevel: grade, sectionName: section });
    }
    
    const studentCount = await Student.countDocuments();
    const studentId = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(3, '0')}`;
    const QRCode = require('qrcode');
    const qrCodeData = await QRCode.toDataURL(studentId);
    
    const student = new Student({
      studentId,
      fullName,
      email,
      section: sectionDoc._id,
      grade,
      qrCode: studentId,
      qrCodeData,
      points: 0
    });
    
    await student.save();
    const populatedStudent = await Student.findById(student._id).populate('section');
    
    res.status(201).json({ success: true, student: populatedStudent });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update student - Admin and Teacher can update
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { fullName, email, grade, section, isActive } = req.body;
    const updateData = { fullName, email, isActive };
    
    if (grade && section) {
      let sectionDoc = await Section.findOne({ gradeLevel: grade, sectionName: section });
      if (!sectionDoc) {
        sectionDoc = await Section.create({ gradeLevel: grade, sectionName: section });
      }
      updateData.section = sectionDoc._id;
      updateData.grade = grade;
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add points - Admin and Teacher can add points
router.patch('/:id/points', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { points } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $inc: { points: points, totalPointsEarned: points } },
      { new: true }
    ).populate('section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, student, message: `Added ${points} points to ${student.fullName}` });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student - Admin and Teacher can delete (FIXED)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Allow both administrator and teacher to delete students
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Admin and Teachers can delete students.' });
    }
    
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    console.log(`Student deleted by ${req.user.role}: ${student.fullName} (${student.studentId})`);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate QR code
router.get('/:id/qrcode', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher', 'canteen_staff'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const QRCode = require('qrcode');
    const qrCodeData = await QRCode.toDataURL(student.qrCode);
    res.json({ success: true, qrCode: qrCodeData, studentId: student.studentId });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;