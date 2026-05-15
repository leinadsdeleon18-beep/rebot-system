const Student = require('../models/Student');
const Section = require('../models/Section');
const QRCode = require('qrcode');

const getStudents = async (req, res) => {
  try {
    const { grade, section, search, grades, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (grades) {
      const gradeArray = grades.split(',');
      const sections = await Section.find({ gradeLevel: { $in: gradeArray } });
      const sectionIds = sections.map(s => s._id);
      query.section = { $in: sectionIds };
    } else if (grade) {
      const sections = await Section.find({ gradeLevel: grade });
      const sectionIds = sections.map(s => s._id);
      query.section = { $in: sectionIds };
    }
    
    if (section) query.section = section;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const students = await Student.find(query)
      .populate('section')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Student.countDocuments(query);
    
    res.json({ success: true, students, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('section');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentByQR = async (req, res) => {
  try {
    const student = await Student.findOne({ qrCode: req.params.qrCode }).populate('section');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { fullName, email, grade, section, phone } = req.body;
    
    let sectionDoc = await Section.findOne({ gradeLevel: grade, sectionName: section });
    if (!sectionDoc) {
      sectionDoc = await Section.create({ gradeLevel: grade, sectionName: section });
    }
    
    const studentCount = await Student.countDocuments();
    const studentId = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(3, '0')}`;
    const qrCode = studentId;
    const qrCodeData = await QRCode.toDataURL(qrCode);
    
    const student = await Student.create({ 
      studentId, 
      fullName, 
      email, 
      section: sectionDoc._id, 
      grade: grade,
      qrCode, 
      qrCodeData, 
      points: 0 
    });
    
    res.status(201).json({ success: true, student });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;
    const createdStudents = [];
    
    for (const studentData of students) {
      let sectionDoc = await Section.findOne({ gradeLevel: studentData.grade, sectionName: studentData.section });
      if (!sectionDoc) {
        sectionDoc = await Section.create({ gradeLevel: studentData.grade, sectionName: studentData.section });
      }
      
      const studentCount = await Student.countDocuments();
      const studentId = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(3, '0')}`;
      const qrCode = studentId;
      const qrCodeData = await QRCode.toDataURL(qrCode);
      
      const student = await Student.create({
        studentId,
        fullName: studentData.name,
        email: studentData.email,
        section: sectionDoc._id,
        grade: studentData.grade,
        qrCode,
        qrCodeData,
        points: 0
      });
      
      createdStudents.push(student);
    }
    
    res.json({ success: true, students: createdStudents, count: createdStudents.length });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { fullName, email, grade, section, isActive } = req.body;
    
    if (grade && section) {
      let sectionDoc = await Section.findOne({ gradeLevel: grade, sectionName: section });
      if (!sectionDoc) {
        sectionDoc = await Section.create({ gradeLevel: grade, sectionName: section });
      }
      req.body.section = sectionDoc._id;
      req.body.grade = grade;
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id, 
      { fullName, email, section: req.body.section, grade: req.body.grade, isActive }, 
      { new: true }
    ).populate('section');
    
    res.json({ success: true, student });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const student = await Student.findById(req.params.id);
    
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    student.points += points;
    student.totalPointsEarned += points;
    await student.save();
    
    res.json({ success: true, student, message: `Added ${points} points to ${student.fullName}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const generateQR = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    const qrCodeData = await QRCode.toDataURL(student.qrCode);
    res.json({ success: true, qrCode: qrCodeData, studentId: student.studentId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudents, getStudentById, getStudentByQR, createStudent, bulkCreateStudents,
  updateStudent, addPoints, deleteStudent, generateQR
};