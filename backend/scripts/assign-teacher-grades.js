// scripts/assign-teacher-grades.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../src/models/User');
const Role = require('../src/models/Role');

async function assignTeacherGrades() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all teachers
    const teacherRole = await Role.findOne({ name: 'teacher' });
    const teachers = await User.find({ role: teacherRole._id });
    
    console.log(`Found ${teachers.length} teachers`);
    
    // Example: Assign grades to specific teachers
    for (const teacher of teachers) {
      if (teacher.username === 'teacher123') {
        teacher.assignedGrades = ['Grade 5'];
        await teacher.save();
        console.log(`✅ Assigned Grade 5 to ${teacher.fullName}`);
      }
    }
    
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignTeacherGrades();