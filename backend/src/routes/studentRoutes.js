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

// Get teacher's assigned sections
router.get('/teacher/sections', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    
    if (user.role.name !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const sections = await Section.find({
      _id: { $in: user.assignedSections || [] }
    }).populate('adviser', 'fullName');
    
    res.json({ success: true, sections });
  } catch (error) {
    console.error('Get teacher sections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all students - WITH PROPER TEACHER FILTERING (Grade + Section)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { grade, section, search } = req.query;
    let query = {};
    
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.id);
    
    // TEACHER FILTERING: If user is teacher, filter by assigned grades AND assigned sections
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      console.log('Teacher assigned grades:', assignedGrades);
      console.log('Teacher assigned sections:', assignedSections);
      
      if (assignedSections && assignedSections.length > 0) {
        // If teacher has assigned sections, filter by those sections
        query.section = { $in: assignedSections };
      } else if (assignedGrades && assignedGrades.length > 0) {
        // Fallback to grade filtering if no sections assigned
        query.grade = { $in: assignedGrades };
      } else {
        // If no assigned grades or sections, return empty array
        console.log('Teacher has no assigned grades or sections, returning empty');
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
    
    // Apply section filter if specified (can be ID or name)
    if (section && section !== 'all') {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(section);
      if (isObjectId) {
        query.section = section;
      } else {
        const sectionDoc = await Section.findOne({ sectionName: section });
        if (sectionDoc) {
          query.section = sectionDoc._id;
        }
      }
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

// Get single student - WITH TEACHER PERMISSION CHECK (Grade + Section)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('section');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      // Check section access first
      if (assignedSections.length > 0) {
        if (!assignedSections.includes(student.section?._id?.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have access to this student' 
          });
        }
      } 
      // Fallback to grade check
      else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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

// Get student by QR code - WITH TEACHER PERMISSION CHECK (Grade + Section)
router.get('/qr/:qrCode', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ qrCode: req.params.qrCode }).populate('section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      if (assignedSections.length > 0) {
        if (!assignedSections.includes(student.section?._id?.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have access to this student' 
          });
        }
      } 
      else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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

// Create student - WITH GRADE & SECTION VALIDATION FOR TEACHERS
router.post('/', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { fullName, email, grade, section, sectionId, phone } = req.body;
    
    const finalSection = sectionId || section;
    
    console.log('Creating student with data:', { fullName, email, grade, section: finalSection });
    
    if (!fullName || !grade || !finalSection) {
      return res.status(400).json({ success: false, message: 'Full name, grade, and section are required' });
    }
    
    let sectionDoc;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(finalSection);
    
    if (isObjectId) {
      sectionDoc = await Section.findById(finalSection);
      if (!sectionDoc) {
        return res.status(404).json({ success: false, message: 'Section not found' });
      }
    } else {
      sectionDoc = await Section.findOne({ 
        gradeLevel: grade, 
        sectionName: finalSection 
      });
      
      if (!sectionDoc) {
        sectionDoc = await Section.create({ 
          gradeLevel: grade, 
          sectionName: finalSection,
          createdAt: new Date()
        });
        console.log('Created new section:', sectionDoc);
      }
    }
    
    // Teacher validation - Check both grade AND section access
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      console.log('Teacher assigned grades:', assignedGrades);
      console.log('Teacher assigned sections:', assignedSections);
      console.log('Attempting to add to grade:', grade);
      console.log('Attempting to add to section:', sectionDoc._id);
      
      // Check section access first
      if (assignedSections.length > 0) {
        if (!assignedSections.includes(sectionDoc._id.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: `You are not assigned to section "${sectionDoc.sectionName}". Only admin can add students to this section.` 
          });
        }
      } 
      // Fallback to grade check
      else if (assignedGrades.length > 0 && !assignedGrades.includes(grade)) {
        return res.status(403).json({ 
          success: false, 
          message: `You can only add students to your assigned grades: ${assignedGrades.join(', ')}` 
        });
      }
    }
    
    const studentId = await generateUniqueStudentId();
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
    
    await Section.findByIdAndUpdate(sectionDoc._id, {
      $addToSet: { students: student._id }
    });
    
    const populatedStudent = await Student.findById(student._id).populate('section');
    const responseStudent = populatedStudent.toObject();
    
    if (populatedStudent.section) {
      responseStudent.sectionName = populatedStudent.section.sectionName;
      responseStudent.gradeLevel = populatedStudent.section.gradeLevel;
    } else {
      responseStudent.sectionName = finalSection;
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

// Update student - WITH TEACHER PERMISSION CHECK (Grade + Section)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { fullName, email, grade, section, isActive } = req.body;
    const updateData = { fullName, email, isActive };
    
    if (req.user.role === 'teacher') {
      const existingStudent = await Student.findById(req.params.id).populate('section');
      if (existingStudent) {
        const teacher = await User.findById(req.user.id);
        const assignedGrades = teacher.assignedGrades || [];
        const assignedSections = teacher.assignedSections || [];
        
        if (assignedSections.length > 0) {
          if (!assignedSections.includes(existingStudent.section?._id?.toString())) {
            return res.status(403).json({ 
              success: false, 
              message: 'You do not have permission to update this student' 
            });
          }
        } 
        else if (assignedGrades.length > 0 && !assignedGrades.includes(existingStudent.grade)) {
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

// Add points - WITH TEACHER PERMISSION CHECK (Grade + Section)
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
    
    if (req.user.role === 'teacher') {
      const student = await Student.findById(req.params.id).populate('section');
      if (student) {
        const teacher = await User.findById(req.user.id);
        const assignedGrades = teacher.assignedGrades || [];
        const assignedSections = teacher.assignedSections || [];
        
        if (assignedSections.length > 0) {
          if (!assignedSections.includes(student.section?._id?.toString())) {
            return res.status(403).json({ 
              success: false, 
              message: 'You do not have permission to add points to this student' 
            });
          }
        } 
        else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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

// Delete student - WITH TEACHER PERMISSION CHECK (Grade + Section)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Only Admin and Teachers can delete students.' });
    }
    
    if (req.user.role === 'teacher') {
      const student = await Student.findById(req.params.id).populate('section');
      if (student) {
        const teacher = await User.findById(req.user.id);
        const assignedGrades = teacher.assignedGrades || [];
        const assignedSections = teacher.assignedSections || [];
        
        if (assignedSections.length > 0) {
          if (!assignedSections.includes(student.section?._id?.toString())) {
            return res.status(403).json({ 
              success: false, 
              message: 'You do not have permission to delete this student' 
            });
          }
        } 
        else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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
    
    await Section.findByIdAndUpdate(student.section, {
      $pull: { students: student._id }
    });
    
    console.log(`Student deleted by ${req.user.role}: ${student.fullName} (${student.studentId})`);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate QR code - WITH TEACHER PERMISSION CHECK (Grade + Section)
router.get('/:id/qrcode', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher', 'canteen_staff'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const student = await Student.findById(req.params.id).populate('section');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      if (assignedSections.length > 0) {
        if (!assignedSections.includes(student.section?._id?.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to access this student\'s QR code' 
          });
        }
      } 
      else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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

// Bulk create students - WITH GRADE VALIDATION FOR TEACHERS (First version)
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { students } = req.body;
    const createdStudents = [];
    const errors = [];
    
    let teacherAssignedGrades = [];
    let teacherAssignedSections = [];
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      teacherAssignedGrades = teacher.assignedGrades || [];
      teacherAssignedSections = teacher.assignedSections || [];
    }
    
    for (const studentData of students) {
      try {
        // Find or create section first to check access
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
        
        // Teacher validation
        if (req.user.role === 'teacher') {
          if (teacherAssignedSections.length > 0) {
            if (!teacherAssignedSections.includes(sectionDoc._id.toString())) {
              errors.push({ 
                name: studentData.name, 
                error: `You are not assigned to section "${studentData.section}" in ${studentData.grade}` 
              });
              continue;
            }
          } 
          else if (teacherAssignedGrades.length > 0 && !teacherAssignedGrades.includes(studentData.grade)) {
            errors.push({ 
              name: studentData.name, 
              error: `Cannot add to grade ${studentData.grade}. You can only add to: ${teacherAssignedGrades.join(', ')}` 
            });
            continue;
          }
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
        
        await Section.findByIdAndUpdate(sectionDoc._id, {
          $addToSet: { students: student._id }
        });
        
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

// Get stats for teacher dashboard - Based on assigned grades OR sections
router.get('/stats/teacher', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const teacher = await User.findById(req.user.id);
    const assignedGrades = teacher.assignedGrades || [];
    const assignedSections = teacher.assignedSections || [];
    
    let students = [];
    
    if (assignedSections.length > 0) {
      students = await Student.find({ section: { $in: assignedSections } });
    } else if (assignedGrades.length > 0) {
      students = await Student.find({ grade: { $in: assignedGrades } });
    }
    
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

// Bulk create students - FULLY FUNCTIONAL with teacher validation (Second version - kept for compatibility)
router.post('/bulk/advanced', authMiddleware, async (req, res) => {
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
    
    let teacherAssignedGrades = [];
    let teacherAssignedSections = [];
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      teacherAssignedGrades = teacher.assignedGrades || [];
      teacherAssignedSections = teacher.assignedSections || [];
      console.log('Teacher assigned grades for bulk import:', teacherAssignedGrades);
      console.log('Teacher assigned sections for bulk import:', teacherAssignedSections);
      
      if (teacherAssignedSections.length === 0 && teacherAssignedGrades.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You have no assigned grades or sections. Please contact administrator.' 
        });
      }
    }
    
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      try {
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
        
        // Teacher validation
        if (req.user.role === 'teacher') {
          if (teacherAssignedSections.length > 0) {
            if (!teacherAssignedSections.includes(sectionDoc._id.toString())) {
              errors.push({ 
                row: i + 1,
                name: studentData.name, 
                error: `You are not assigned to section "${studentData.section}" in ${studentData.grade}` 
              });
              continue;
            }
          } 
          else if (teacherAssignedGrades.length > 0 && !teacherAssignedGrades.includes(studentData.grade)) {
            errors.push({ 
              row: i + 1,
              name: studentData.name, 
              error: `Cannot add to grade "${studentData.grade}". You can only add to: ${teacherAssignedGrades.join(', ')}` 
            });
            continue;
          }
        }
        
        // Check if student already exists
        const existingStudent = await Student.findOne({ 
          fullName: { $regex: new RegExp(`^${studentData.name}$`, 'i') },
          section: sectionDoc._id
        });
        
        if (existingStudent) {
          errors.push({ 
            row: i + 1,
            name: studentData.name, 
            error: `Student "${studentData.name}" already exists in ${studentData.grade} - ${studentData.section}` 
          });
          continue;
        }
        
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
        
        await Section.findByIdAndUpdate(sectionDoc._id, {
          $addToSet: { students: student._id }
        });
        
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