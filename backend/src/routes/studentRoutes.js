const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Section = require('../models/Section');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const QRCode = require('qrcode');

// Helper function to generate unique student ID
async function generateUniqueStudentId() {
  const year = new Date().getFullYear();
  
  const lastStudent = await Student.findOne().sort({ studentId: -1 });
  
  let nextNumber = 1;
  if (lastStudent && lastStudent.studentId) {
    const match = lastStudent.studentId.match(/STU-\d{4}-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  let studentId = `STU-${year}-${String(nextNumber).padStart(3, '0')}`;
  let exists = await Student.findOne({ studentId });
  
  while (exists) {
    nextNumber++;
    studentId = `STU-${year}-${String(nextNumber).padStart(3, '0')}`;
    exists = await Student.findOne({ studentId });
  }
  
  return studentId;
}

// Get all students - WITH PROPER TEACHER FILTERING
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { grade, section, search } = req.query;
    let query = {};
    
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.id);
    
    // TEACHER FILTERING: If user is teacher, only show their assigned grades
    if (req.user.role === 'teacher') {
      // Get teacher's assigned grades from user object
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      console.log('Teacher assigned grades:', assignedGrades);
      
      if (assignedGrades && assignedGrades.length > 0) {
        // Only show students from assigned grades
        query.grade = { $in: assignedGrades };
      } else {
        // If no assigned grades, return empty array (teacher sees nothing)
        console.log('Teacher has no assigned grades, returning empty');
        return res.json({ success: true, students: [] });
      }
    }
    
    // Apply additional grade filter if specified
    if (grade && grade !== 'all') {
      if (query.grade) {
        query.grade = { $in: [grade] };
      } else {
        query.grade = grade;
      }
    }
    
    // Apply section filter if specified
    if (section && section !== 'all') {
      query.section = section;
    }
    
    // Apply search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Final query:', JSON.stringify(query));
    
    const students = await Student.find(query)
      .populate('section')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${students.length} students for teacher`);
    
    // Format students with proper section data
    const formattedStudents = students.map(student => {
      const studentObj = student.toObject();
      if (student.section) {
        studentObj.sectionName = student.section.sectionName;
        studentObj.gradeLevel = student.section.gradeLevel;
      } else {
        studentObj.sectionName = 'N/A';
        studentObj.gradeLevel = student.grade || 'N/A';
      }
      return studentObj;
    });
    
    res.json({ success: true, students: formattedStudents });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single student - WITH TEACHER PERMISSION CHECK
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('section');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Check if teacher has access to this student's grade
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have access to this student' 
        });
      }
    }
    
    const studentObj = student.toObject();
    if (student.section) {
      studentObj.sectionName = student.section.sectionName;
      studentObj.gradeLevel = student.section.gradeLevel;
    } else {
      studentObj.sectionName = 'N/A';
      studentObj.gradeLevel = student.grade || 'N/A';
    }
    
    res.json({ success: true, student: studentObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student by QR code - WITH TEACHER PERMISSION CHECK
router.get('/qr/:qrCode', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ qrCode: req.params.qrCode }).populate('section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Check if teacher has access to this student's grade
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have access to this student' 
        });
      }
    }
    
    const studentObj = student.toObject();
    if (student.section) {
      studentObj.sectionName = student.section.sectionName;
      studentObj.gradeLevel = student.section.gradeLevel;
    }
    
    res.json({ success: true, student: studentObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create student - WITH GRADE VALIDATION FOR TEACHERS
router.post('/', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { fullName, email, grade, section, phone } = req.body;
    
    console.log('Creating student with data:', { fullName, email, grade, section });
    
    // Validate required fields
    if (!fullName || !grade || !section) {
      return res.status(400).json({ success: false, message: 'Full name, grade, and section are required' });
    }
    
    // If teacher, check if they are allowed to add student to this grade
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      console.log('Teacher assigned grades:', assignedGrades);
      console.log('Attempting to add to grade:', grade);
      
      if (assignedGrades.length > 0 && !assignedGrades.includes(grade)) {
        return res.status(403).json({ 
          success: false, 
          message: `You can only add students to your assigned grades: ${assignedGrades.join(', ')}` 
        });
      }
    }
    
    // Find or create section
    let sectionDoc = await Section.findOne({ 
      gradeLevel: grade, 
      sectionName: section 
    });
    
    if (!sectionDoc) {
      sectionDoc = await Section.create({ 
        gradeLevel: grade, 
        sectionName: section,
        createdAt: new Date()
      });
      console.log('Created new section:', sectionDoc);
    }
    
    // Generate unique student ID
    const studentId = await generateUniqueStudentId();
    console.log('Generated student ID:', studentId);
    
    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(studentId);
    
    const student = new Student({
      studentId,
      fullName,
      email: email || '',
      section: sectionDoc._id,
      grade: grade,
      qrCode: studentId,
      qrCodeData,
      points: 0,
      isActive: true
    });
    
    await student.save();
    console.log('Student saved successfully:', student.studentId);
    
    // Populate section data for response
    const populatedStudent = await Student.findById(student._id).populate('section');
    const responseStudent = populatedStudent.toObject();
    
    if (populatedStudent.section) {
      responseStudent.sectionName = populatedStudent.section.sectionName;
      responseStudent.gradeLevel = populatedStudent.section.gradeLevel;
    } else {
      responseStudent.sectionName = section;
      responseStudent.gradeLevel = grade;
    }
    
    res.status(201).json({ 
      success: true, 
      student: responseStudent,
      message: `Student ${fullName} added successfully with ID: ${studentId}`
    });
  } catch (error) {
    console.error('Create student error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID already exists. Please try again.' 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update student - WITH TEACHER PERMISSION CHECK
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { fullName, email, grade, section, isActive } = req.body;
    const updateData = { fullName, email, isActive };
    
    // If teacher, check if they can update this student
    if (req.user.role === 'teacher') {
      const existingStudent = await Student.findById(req.params.id);
      if (existingStudent) {
        const teacher = await User.findById(req.user.id);
        const assignedGrades = teacher.assignedGrades || [];
        
        if (assignedGrades.length > 0 && !assignedGrades.includes(existingStudent.grade)) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to update this student' 
          });
        }
      }
    }
    
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
      { new: true, runValidators: true }
    ).populate('section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const studentObj = student.toObject();
    if (student.section) {
      studentObj.sectionName = student.section.sectionName;
      studentObj.gradeLevel = student.section.gradeLevel;
    }
    
    res.json({ success: true, student: studentObj });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add points - WITH TEACHER PERMISSION CHECK
router.patch('/:id/points', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { points } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Points must be a positive number' });
    }
    
    // Check if teacher has access to this student
    if (req.user.role === 'teacher') {
      const student = await Student.findById(req.params.id);
      if (student) {
        const teacher = await User.findById(req.user.id);
        const assignedGrades = teacher.assignedGrades || [];
        
        if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to add points to this student' 
          });
        }
      }
    }
    
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { 
          points: points, 
          totalPointsEarned: points 
        } 
      },
      { new: true }
    ).populate('section');
    
    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const studentObj = updatedStudent.toObject();
    if (updatedStudent.section) {
      studentObj.sectionName = updatedStudent.section.sectionName;
      studentObj.gradeLevel = updatedStudent.section.gradeLevel;
    }
    
    res.json({ 
      success: true, 
      student: studentObj, 
      message: `Added ${points} points to ${updatedStudent.fullName}` 
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student - WITH TEACHER PERMISSION CHECK
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Admin and Teachers can delete students.' });
    }
    
    // Check if teacher has access to this student
    if (req.user.role === 'teacher') {
      const student = await Student.findById(req.params.id);
      if (student) {
        const teacher = await User.findById(req.user.id);
        const assignedGrades = teacher.assignedGrades || [];
        
        if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to delete this student' 
          });
        }
      }
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

// Generate QR code - WITH TEACHER PERMISSION CHECK
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
    
    // Check if teacher has access to this student's QR code
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      
      if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to access this student\'s QR code' 
        });
      }
    }
    
    if (student.qrCodeData) {
      return res.json({ success: true, qrCode: student.qrCodeData, studentId: student.studentId });
    }
    
    const qrCodeData = await QRCode.toDataURL(student.studentId);
    student.qrCodeData = qrCodeData;
    await student.save();
    
    res.json({ success: true, qrCode: qrCodeData, studentId: student.studentId });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk create students - WITH GRADE VALIDATION FOR TEACHERS
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { students } = req.body;
    const createdStudents = [];
    const errors = [];
    
    // Get teacher's assigned grades if applicable
    let teacherAssignedGrades = [];
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      teacherAssignedGrades = teacher.assignedGrades || [];
    }
    
    for (const studentData of students) {
      try {
        // Check if teacher is allowed to add to this grade
        if (req.user.role === 'teacher' && teacherAssignedGrades.length > 0) {
          if (!teacherAssignedGrades.includes(studentData.grade)) {
            errors.push({ 
              name: studentData.name, 
              error: `Cannot add to grade ${studentData.grade}. You can only add to: ${teacherAssignedGrades.join(', ')}` 
            });
            continue;
          }
        }
        
        let sectionDoc = await Section.findOne({ 
          gradeLevel: studentData.grade, 
          sectionName: studentData.section 
        });
        
        if (!sectionDoc) {
          sectionDoc = await Section.create({ 
            gradeLevel: studentData.grade, 
            sectionName: studentData.section 
          });
        }
        
        const studentId = await generateUniqueStudentId();
        const qrCodeData = await QRCode.toDataURL(studentId);
        
        const student = new Student({
          studentId,
          fullName: studentData.name,
          email: studentData.email || '',
          section: sectionDoc._id,
          grade: studentData.grade,
          qrCode: studentId,
          qrCodeData,
          points: 0,
          isActive: true
        });
        
        await student.save();
        createdStudents.push(student);
      } catch (error) {
        console.error('Error creating student:', studentData.name, error);
        errors.push({ name: studentData.name, error: error.message });
      }
    }
    
    res.json({ 
      success: true, 
      students: createdStudents, 
      count: createdStudents.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stats for teacher dashboard - Only count assigned grade students
router.get('/stats/teacher', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const teacher = await User.findById(req.user.id);
    const assignedGrades = teacher.assignedGrades || [];
    
    if (assignedGrades.length === 0) {
      return res.json({ 
        success: true, 
        stats: { totalStudents: 0, totalPoints: 0, totalRedemptions: 0 }
      });
    }
    
    const students = await Student.find({ grade: { $in: assignedGrades } });
    const totalStudents = students.length;
    const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
    
    res.json({ 
      success: true, 
      stats: { 
        totalStudents, 
        totalPoints, 
        totalRedemptions: 0 
      }
    });
  } catch (error) {
    console.error('Teacher stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this to your existing studentRoutes.js file

// Bulk create students - FULLY FUNCTIONAL with teacher validation
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { students } = req.body;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'No student data provided' });
    }
    
    console.log(`Bulk import started: ${students.length} students to process`);
    
    const createdStudents = [];
    const errors = [];
    
    // Get teacher's assigned grades if applicable
    let teacherAssignedGrades = [];
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      teacherAssignedGrades = teacher.assignedGrades || [];
      console.log('Teacher assigned grades for bulk import:', teacherAssignedGrades);
      
      if (teacherAssignedGrades.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You have no assigned grades. Please contact administrator.' 
        });
      }
    }
    
    // Process each student
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      try {
        // Validate required fields
        if (!studentData.name || !studentData.name.trim()) {
          errors.push({ 
            row: i + 1,
            name: 'Unknown', 
            error: 'Student name is required' 
          });
          continue;
        }
        
        if (!studentData.grade || !studentData.grade.trim()) {
          errors.push({ 
            row: i + 1,
            name: studentData.name, 
            error: 'Grade is required' 
          });
          continue;
        }
        
        if (!studentData.section || !studentData.section.trim()) {
          errors.push({ 
            row: i + 1,
            name: studentData.name, 
            error: 'Section is required' 
          });
          continue;
        }
        
        // Check if teacher is allowed to add to this grade
        if (req.user.role === 'teacher' && teacherAssignedGrades.length > 0) {
          if (!teacherAssignedGrades.includes(studentData.grade)) {
            errors.push({ 
              row: i + 1,
              name: studentData.name, 
              error: `Cannot add to grade "${studentData.grade}". You can only add to: ${teacherAssignedGrades.join(', ')}` 
            });
            continue;
          }
        }
        
        // Check if student already exists (by name and grade/section combination)
        const existingStudent = await Student.findOne({ 
          fullName: { $regex: new RegExp(`^${studentData.name}$`, 'i') },
          grade: studentData.grade
        });
        
        if (existingStudent) {
          errors.push({ 
            row: i + 1,
            name: studentData.name, 
            error: `Student "${studentData.name}" already exists in ${studentData.grade}` 
          });
          continue;
        }
        
        // Find or create section
        let sectionDoc = await Section.findOne({ 
          gradeLevel: studentData.grade, 
          sectionName: studentData.section 
        });
        
        if (!sectionDoc) {
          sectionDoc = await Section.create({ 
            gradeLevel: studentData.grade, 
            sectionName: studentData.section,
            createdAt: new Date()
          });
          console.log(`Created new section: ${studentData.grade} - ${studentData.section}`);
        }
        
        // Generate unique student ID
        const studentId = await generateUniqueStudentId();
        const qrCodeData = await QRCode.toDataURL(studentId);
        
        const student = new Student({
          studentId,
          fullName: studentData.name.trim(),
          email: studentData.email ? studentData.email.trim() : '',
          section: sectionDoc._id,
          grade: studentData.grade,
          qrCode: studentId,
          qrCodeData,
          points: 0,
          isActive: true,
          createdAt: new Date()
        });
        
        await student.save();
        createdStudents.push({
          id: student._id,
          studentId: student.studentId,
          name: student.fullName,
          grade: student.grade,
          section: studentData.section
        });
        
        console.log(`✅ Created student: ${student.fullName} (${student.studentId})`);
        
      } catch (error) {
        console.error(`Error creating student at row ${i + 1}:`, error);
        errors.push({ 
          row: i + 1,
          name: studentData.name || 'Unknown', 
          error: error.message || 'Database error' 
        });
      }
    }
    
    console.log(`Bulk import completed: ${createdStudents.length} created, ${errors.length} errors`);
    
    res.json({ 
      success: true, 
      students: createdStudents, 
      count: createdStudents.length,
      totalAttempted: students.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${createdStudents.length} out of ${students.length} students.`
    });
    
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;