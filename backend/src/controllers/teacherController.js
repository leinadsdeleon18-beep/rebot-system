// src/controllers/teacherController.js
const Student = require('../models/Student');
const Section = require('../models/Section');

const getTeacherStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('section').limit(50);
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSections = async (req, res) => {
  try {
    const sections = await Section.find();
    res.json({ success: true, sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTeacherStudents, getSections };