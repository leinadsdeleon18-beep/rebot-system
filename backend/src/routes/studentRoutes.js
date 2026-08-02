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

// Get teacher's assigned sections with student counts
router.get('/teacher/sections', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const teacher = await User.findById(req.user.id);
    const assignedSections = teacher.assignedSections || [];
    const assignedGrades = teacher.assignedGrades || [];
    
    let sections = [];
    
    if (assignedSections && assignedSections.length > 0) {
      sections = await Section.find({
        _id: { $in: assignedSections }
      }).populate('adviser', 'fullName');
    } else if (assignedGrades && assignedGrades.length > 0) {
      sections = await Section.find({
        gradeLevel: { $in: assignedGrades }
      }).populate('adviser', 'fullName');
    }
    
    // Get student count for each section
    const sectionsWithCount = await Promise.all(sections.map(async (section) => {
      const count = await Student.countDocuments({ section: section._id });
      return {
        ...section.toObject(),
        studentCount: count
      };
    }));
    
    console.log(`📚 Teacher ${teacher.fullName} has ${sectionsWithCount.length} sections`);
    console.log('📚 Sections:', sectionsWithCount.map(s => `${s.gradeLevel} - ${s.sectionName} (${s.studentCount} students)`));
    
    res.json({ success: true, sections: sectionsWithCount });
  } catch (error) {
    console.error('Get teacher sections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all students - WITH TEACHER FILTERING
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { grade, section, search } = req.query;
    let query = {};
    
    console.log('🔍 Fetching students - User role:', req.user.role);
    console.log('🔍 User ID:', req.user.id);
    
    // TEACHER FILTERING
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      console.log('📚 Teacher assigned grades:', assignedGrades);
      console.log('📚 Teacher assigned sections:', assignedSections);
      
      // Build the filter based on assigned sections or grades
      if (assignedSections && assignedSections.length > 0) {
        // Teacher has specific sections assigned
        query.section = { $in: assignedSections };
        console.log('🔍 Filtering by assigned sections:', assignedSections);
      } else if (assignedGrades && assignedGrades.length > 0) {
        // Teacher has grades assigned (fallback)
        // First find all sections in these grades
        const sectionsInGrades = await Section.find({
          gradeLevel: { $in: assignedGrades }
        }).select('_id');
        
        const sectionIds = sectionsInGrades.map(s => s._id);
        if (sectionIds.length > 0) {
          query.section = { $in: sectionIds };
          console.log('🔍 Filtering by sections in grades:', assignedGrades, 'Found sections:', sectionIds.length);
        } else {
          // No sections found in assigned grades
          console.log('⚠️ No sections found for assigned grades:', assignedGrades);
          return res.json({ success: true, students: [] });
        }
      } else {
        // No assigned grades or sections
        console.log('⚠️ Teacher has no assigned grades or sections, returning empty');
        return res.json({ success: true, students: [] });
      }
    }
    
    // Apply grade filter (if specified in query)
    if (grade && grade !== 'all') {
      if (query.grade) {
        query.grade = { $in: [grade] };
      } else {
        query.grade = grade;
      }
    }
    
    // Apply section filter (if specified in query)
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
    
    console.log('📝 Final query:', JSON.stringify(query));
    
    // Populate the section field
    const students = await Student.find(query)
      .populate({
        path: 'section',
        select: 'sectionName gradeLevel _id adviser'
      })
      .sort({ createdAt: -1 });
    
    console.log(`📋 Found ${students.length} students for ${req.user.role}`);
    
    // Format students with section data
    const formattedStudents = students.map(student => {
      const studentObj = student.toObject();
      
      if (student.section) {
        studentObj.section = {
          _id: student.section._id,
          sectionName: student.section.sectionName || 'N/A',
          gradeLevel: student.section.gradeLevel || student.grade || 'N/A'
        };
        studentObj.sectionName = student.section.sectionName || 'N/A';
        studentObj.gradeLevel = student.section.gradeLevel || student.grade || 'N/A';
        studentObj.sectionId = student.section._id;
      } else {
        studentObj.section = null;
        studentObj.sectionName = 'N/A';
        studentObj.gradeLevel = student.grade || 'N/A';
        studentObj.sectionId = null;
      }
      
      return studentObj;
    });
    
    // Log sample student
    if (formattedStudents.length > 0) {
      console.log('📝 Sample formatted student:', {
        name: formattedStudents[0].fullName,
        grade: formattedStudents[0].grade,
        sectionName: formattedStudents[0].sectionName,
        section: formattedStudents[0].section
      });
    }
    
    res.json({ success: true, students: formattedStudents });
  } catch (error) {
    console.error('❌ Get students error:', error);
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
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      // Check section access first
      if (assignedSections.length > 0) {
        if (!student.section || !assignedSections.includes(student.section._id.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have access to this student' 
          });
        }
      } else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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

// Get student by QR code
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
        if (!student.section || !assignedSections.includes(student.section._id.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have access to this student' 
          });
        }
      } else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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

// Create student
router.post('/', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['administrator', 'teacher'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { fullName, email, grade, section, sectionId, phone } = req.body;
    
    const finalSection = sectionId || section;
    
    console.log('📝 Creating student with data:', { fullName, email, grade, section: finalSection });
    
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
        console.log('✅ Created new section:', sectionDoc);
      }
    }
    
    // Teacher validation - check if teacher has access to this section/grade
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      console.log('📚 Teacher assigned grades:', assignedGrades);
      console.log('📚 Teacher assigned sections:', assignedSections);
      console.log('📚 Attempting to add to section:', sectionDoc._id, 'grade:', grade);
      
      // Check section access first
      if (assignedSections.length > 0) {
        if (!assignedSections.includes(sectionDoc._id.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: `You are not assigned to section "${sectionDoc.sectionName}". Only admin can add students to this section.` 
          });
        }
      } else if (assignedGrades.length > 0 && !assignedGrades.includes(grade)) {
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
    console.log('✅ Student saved successfully:', student.studentId);
    
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
    console.error('❌ Create student error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID already exists. Please try again.' 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update student
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
          if (!existingStudent.section || !assignedSections.includes(existingStudent.section._id.toString())) {
            return res.status(403).json({ 
              success: false, 
              message: 'You do not have permission to update this student' 
            });
          }
        } else if (assignedGrades.length > 0 && !assignedGrades.includes(existingStudent.grade)) {
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
    console.error('❌ Update student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add points
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
          if (!student.section || !assignedSections.includes(student.section._id.toString())) {
            return res.status(403).json({ 
              success: false, 
              message: 'You do not have permission to add points to this student' 
            });
          }
        } else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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
    console.error('❌ Add points error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student
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
          if (!student.section || !assignedSections.includes(student.section._id.toString())) {
            return res.status(403).json({ 
              success: false, 
              message: 'You do not have permission to delete this student' 
            });
          }
        } else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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
    
    console.log(`🗑️ Student deleted by ${req.user.role}: ${student.fullName} (${student.studentId})`);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('❌ Delete student error:', error);
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
    
    const student = await Student.findById(req.params.id).populate('section');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      const assignedGrades = teacher.assignedGrades || [];
      const assignedSections = teacher.assignedSections || [];
      
      if (assignedSections.length > 0) {
        if (!student.section || !assignedSections.includes(student.section._id.toString())) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to access this student\'s QR code' 
          });
        }
      } else if (assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
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
    console.error('❌ Generate QR error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk create students
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
        
        if (req.user.role === 'teacher') {
          if (teacherAssignedSections.length > 0) {
            if (!teacherAssignedSections.includes(sectionDoc._id.toString())) {
              errors.push({ 
                name: studentData.name, 
                error: `You are not assigned to section "${studentData.section}" in ${studentData.grade}` 
              });
              continue;
            }
          } else if (teacherAssignedGrades.length > 0 && !teacherAssignedGrades.includes(studentData.grade)) {
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
    console.error('❌ Bulk create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk create students - Advanced version
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
    
    console.log(`📥 Bulk import started: ${students.length} students to process`);
    
    const createdStudents = [];
    const errors = [];
    
    let teacherAssignedGrades = [];
    let teacherAssignedSections = [];
    
    if (req.user.role === 'teacher') {
      const teacher = await User.findById(req.user.id);
      teacherAssignedGrades = teacher.assignedGrades || [];
      teacherAssignedSections = teacher.assignedSections || [];
      console.log('📚 Teacher assigned grades for bulk import:', teacherAssignedGrades);
      console.log('📚 Teacher assigned sections for bulk import:', teacherAssignedSections);
      
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
          errors.push({ row: i + 1, name: 'Unknown', error: 'Student name is required' });
          continue;
        }
        
        if (!studentData.grade || !studentData.grade.trim()) {
          errors.push({ row: i + 1, name: studentData.name, error: 'Grade is required' });
          continue;
        }
        
        if (!studentData.section || !studentData.section.trim()) {
          errors.push({ row: i + 1, name: studentData.name, error: 'Section is required' });
          continue;
        }
        
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
          console.log(`✅ Created new section: ${studentData.grade} - ${studentData.section}`);
        }
        
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
          } else if (teacherAssignedGrades.length > 0 && !teacherAssignedGrades.includes(studentData.grade)) {
            errors.push({ 
              row: i + 1,
              name: studentData.name, 
              error: `Cannot add to grade "${studentData.grade}". You can only add to: ${teacherAssignedGrades.join(', ')}` 
            });
            continue;
          }
        }
        
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
        
        createdStudents.push({
          id: student._id,
          studentId: student.studentId,
          name: student.fullName,
          grade: student.grade,
          section: studentData.section
        });
        
        console.log(`✅ Created student: ${student.fullName} (${student.studentId}) with section: ${sectionDoc.sectionName}`);
        
      } catch (error) {
        console.error(`❌ Error creating student at row ${i + 1}:`, error);
        errors.push({ 
          row: i + 1,
          name: studentData.name || 'Unknown', 
          error: error.message || 'Database error' 
        });
      }
    }
    
    console.log(`✅ Bulk import completed: ${createdStudents.length} created, ${errors.length} errors`);
    
    res.json({ 
      success: true, 
      students: createdStudents, 
      count: createdStudents.length,
      totalAttempted: students.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${createdStudents.length} out of ${students.length} students.`
    });
    
  } catch (error) {
    console.error('❌ Bulk create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stats for teacher dashboard
router.get('/stats/teacher', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const teacher = await User.findById(req.user.id);
    const assignedGrades = teacher.assignedGrades || [];
    const assignedSections = teacher.assignedSections || [];
    
    let students = [];
    
    if (assignedSections && assignedSections.length > 0) {
      students = await Student.find({ section: { $in: assignedSections } });
    } else if (assignedGrades && assignedGrades.length > 0) {
      // Find sections in assigned grades first
      const sections = await Section.find({ gradeLevel: { $in: assignedGrades } });
      const sectionIds = sections.map(s => s._id);
      if (sectionIds.length > 0) {
        students = await Student.find({ section: { $in: sectionIds } });
      }
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
    console.error('❌ Teacher stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fix student sections - Admin only
router.post('/fix-student-sections', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const sections = await Section.find();
    const students = await Student.find();
    
    let updated = 0;
    const updates = [];
    
    for (const student of students) {
      if (!student.section) {
        const matchingSection = sections.find(s => s.gradeLevel === student.grade);
        if (matchingSection) {
          student.section = matchingSection._id;
          await student.save();
          updated++;
          updates.push({
            student: student.fullName,
            newSection: matchingSection.sectionName,
            grade: student.grade
          });
        }
        continue;
      }
      
      const sectionExists = sections.some(s => s._id.toString() === student.section.toString());
      
      if (!sectionExists) {
        const matchingSection = sections.find(s => s.gradeLevel === student.grade);
        if (matchingSection) {
          student.section = matchingSection._id;
          await student.save();
          updated++;
          updates.push({
            student: student.fullName,
            oldSection: student.section,
            newSection: matchingSection.sectionName,
            grade: student.grade
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updated} students`,
      updated,
      updates
    });
  } catch (error) {
    console.error('❌ Fix sections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint to check student sections
router.get('/debug/check-sections', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const students = await Student.find().populate('section');
    const sections = await Section.find();
    
    const result = students.map(s => ({
      id: s._id,
      name: s.fullName,
      grade: s.grade,
      sectionId: s.section?._id || s.section,
      sectionName: s.section?.sectionName || 'N/A',
      sectionGrade: s.section?.gradeLevel || 'N/A',
      hasSection: !!s.section
    }));
    
    res.json({
      success: true,
      totalStudents: result.length,
      totalSections: sections.length,
      sections: sections.map(s => ({
        id: s._id,
        name: s.sectionName,
        grade: s.gradeLevel
      })),
      students: result,
      studentsWithoutSection: result.filter(s => !s.hasSection).length
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;