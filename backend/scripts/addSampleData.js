const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function addSampleData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check if we already have students
    const studentCount = await db.collection('students').countDocuments();
    if (studentCount > 0) {
      console.log(`Already have ${studentCount} students. Dashboard will show data!`);
      await mongoose.disconnect();
      return;
    }
    
    // Add sample students
    await db.collection('students').insertMany([
      {
        studentId: 'STU-2024-0001',
        fullName: 'Juan Dela Cruz',
        email: 'juan@student.ph',
        points: 45,
        grade: 'Grade 5',
        section: 'Section A',
        isActive: true,
        createdAt: new Date()
      },
      {
        studentId: 'STU-2024-0002',
        fullName: 'Maria Santos',
        email: 'maria@student.ph',
        points: 28,
        grade: 'Grade 5',
        section: 'Section A',
        isActive: true,
        createdAt: new Date()
      },
      {
        studentId: 'STU-2024-0003',
        fullName: 'Jose Rizal',
        email: 'jose@student.ph',
        points: 62,
        grade: 'Grade 6',
        section: 'Section B',
        isActive: true,
        createdAt: new Date()
      }
    ]);
    
    console.log('✅ Added 3 sample students');
    
    // Add sample rewards
    await db.collection('rewards').insertMany([
      { name: 'Biscuit', pointsRequired: 10, category: 'snacks', stock: 50, isActive: true, createdAt: new Date() },
      { name: 'Chocolate Bar', pointsRequired: 25, category: 'snacks', stock: 30, isActive: true, createdAt: new Date() },
      { name: 'Juice Box', pointsRequired: 15, category: 'drinks', stock: 40, isActive: true, createdAt: new Date() },
      { name: 'Pencil Set', pointsRequired: 50, category: 'school_supplies', stock: 20, isActive: true, createdAt: new Date() },
      { name: 'Notebook', pointsRequired: 75, category: 'school_supplies', stock: 15, isActive: true, createdAt: new Date() }
    ]);
    
    console.log('✅ Added 5 sample rewards');
    
    // Add sample transactions
    const students = await db.collection('students').find().toArray();
    await db.collection('transactions').insertMany([
      {
        student: students[0]._id,
        type: 'recycling',
        totalPoints: 10,
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        student: students[1]._id,
        type: 'recycling',
        totalPoints: 5,
        status: 'completed',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        student: students[2]._id,
        type: 'redemption',
        totalPoints: 25,
        status: 'completed',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ]);
    
    console.log('✅ Added 3 sample transactions');
    
    console.log('\n✅ SAMPLE DATA ADDED SUCCESSFULLY!');
    console.log('\n📊 Dashboard will now show:');
    console.log('   - Total Students: 3');
    console.log('   - Total Points: 135');
    console.log('   - 5 Rewards available');
    console.log('   - Recent transactions');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addSampleData();