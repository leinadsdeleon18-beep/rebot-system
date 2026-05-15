const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('========================================');
console.log('ReBot Database Reset Script');
console.log('========================================');
console.log('');

async function resetDatabase() {
  try {
    // Connect to MongoDB Atlas
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected successfully!');
    console.log('📚 Database:', mongoose.connection.db.databaseName);
    console.log('');
    
    const db = mongoose.connection.db;
    
    // Drop existing collections
    console.log('🗑️  Dropping existing collections...');
    const collections = await db.collections();
    for (const collection of collections) {
      if (collection.collectionName === 'users' || collection.collectionName === 'roles') {
        await collection.drop();
        console.log(`   ✅ Dropped ${collection.collectionName}`);
      }
    }
    console.log('');
    
    // ========== CREATE ROLES ==========
    console.log('👥 Creating roles...');
    const rolesCollection = db.collection('roles');
    
    const roles = [
      { 
        name: 'administrator', 
        permissions: ['all', 'manage_users', 'manage_system', 'view_reports'],
        createdAt: new Date() 
      },
      { 
        name: 'teacher', 
        permissions: ['manage_students', 'redeem_rewards', 'view_reports', 'add_points'],
        createdAt: new Date() 
      },
      { 
        name: 'canteen_staff', 
        permissions: ['redeem_rewards', 'manage_inventory', 'view_transactions'],
        createdAt: new Date() 
      },
      { 
        name: 'junk_shop_personnel', 
        permissions: ['manage_collections', 'view_bins', 'schedule_pickups'],
        createdAt: new Date() 
      },
      { 
        name: 'utility_staff', 
        permissions: ['view_bins', 'update_bin_status', 'maintenance'],
        createdAt: new Date() 
      },
      { 
        name: 'student', 
        permissions: ['view_points', 'redeem_rewards', 'view_history'],
        createdAt: new Date() 
      }
    ];
    
    const rolesResult = await rolesCollection.insertMany(roles);
    console.log(`✅ Created ${rolesResult.insertedCount} roles:`);
    roles.forEach(r => console.log(`   - ${r.name}`));
    console.log('');
    
    // Get role IDs for reference
    const adminRole = await rolesCollection.findOne({ name: 'administrator' });
    const teacherRole = await rolesCollection.findOne({ name: 'teacher' });
    const canteenRole = await rolesCollection.findOne({ name: 'canteen_staff' });
    const junkRole = await rolesCollection.findOne({ name: 'junk_shop_personnel' });
    const utilityRole = await rolesCollection.findOne({ name: 'utility_staff' });
    const studentRole = await rolesCollection.findOne({ name: 'student' });
    
    // ========== CREATE USERS ==========
    console.log('👤 Creating users...');
    const usersCollection = db.collection('users');
    
    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const teacherPass = await bcrypt.hash('teacher123', 10);
    const canteenPass = await bcrypt.hash('canteen123', 10);
    const junkPass = await bcrypt.hash('junk123', 10);
    const utilityPass = await bcrypt.hash('utility123', 10);
    const studentPass = await bcrypt.hash('student123', 10);
    
    const users = [
      { 
        username: 'admin123', 
        email: 'admin@rebot.ph', 
        password: adminPass, 
        fullName: 'Admin User', 
        role: adminRole._id, 
        roleName: 'administrator',
        isActive: true,
        createdAt: new Date()
      },
      { 
        username: 'teacher123', 
        email: 'teacher@rebot.ph', 
        password: teacherPass, 
        fullName: 'Maria Santos', 
        role: teacherRole._id, 
        roleName: 'teacher',
        isActive: true,
        assignedGrades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
        createdAt: new Date()
      },
      { 
        username: 'canteen123', 
        email: 'canteen@rebot.ph', 
        password: canteenPass, 
        fullName: 'Rosa Mercado', 
        role: canteenRole._id, 
        roleName: 'canteen_staff',
        isActive: true,
        createdAt: new Date()
      },
      { 
        username: 'junk123', 
        email: 'junk@rebot.ph', 
        password: junkPass, 
        fullName: 'Juan Reyes', 
        role: junkRole._id, 
        roleName: 'junk_shop_personnel',
        isActive: true,
        createdAt: new Date()
      },
      { 
        username: 'utility123', 
        email: 'utility@rebot.ph', 
        password: utilityPass, 
        fullName: 'Utility Staff', 
        role: utilityRole._id, 
        roleName: 'utility_staff',
        isActive: true,
        createdAt: new Date()
      },
      { 
        username: 'student123', 
        email: 'student@rebot.ph', 
        password: studentPass, 
        fullName: 'Juan Dela Cruz', 
        role: studentRole._id, 
        roleName: 'student',
        isActive: true,
        points: 150,
        studentId: 'STU-2024-0001',
        createdAt: new Date()
      }
    ];
    
    const usersResult = await usersCollection.insertMany(users);
    console.log(`✅ Created ${usersResult.insertedCount} users:`);
    users.forEach(u => console.log(`   - ${u.username} (${u.roleName}) - ${u.fullName}`));
    console.log('');
    
    // ========== CREATE INDEXES ==========
    console.log('📇 Creating indexes...');
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 });
    await usersCollection.createIndex({ role: 1 });
    await rolesCollection.createIndex({ name: 1 }, { unique: true });
    console.log('✅ Indexes created');
    console.log('');
    
    // ========== VERIFY ==========
    console.log('🔍 Verifying data...');
    const userCount = await usersCollection.countDocuments();
    const roleCount = await rolesCollection.countDocuments();
    console.log(`   ✅ Total Users: ${userCount}`);
    console.log(`   ✅ Total Roles: ${roleCount}`);
    console.log('');
    
    // Display all users with their roles
    const allUsers = await usersCollection.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      { $unwind: '$roleInfo' }
    ]).toArray();
    
    console.log('📋 User List with Roles:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    allUsers.forEach(u => {
      console.log(`   ${u.username.padEnd(15)} → ${u.roleInfo.name.padEnd(18)} → ${u.fullName}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    console.log('========================================');
    console.log('✅ DATABASE RESET COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin:        admin123 / admin123');
    console.log('👨‍🏫 Teacher:      teacher123 / teacher123');
    console.log('🍽️ Canteen:      canteen123 / canteen123');
    console.log('♻️ Junk Shop:    junk123 / junk123');
    console.log('🔧 Utility:      utility123 / utility123');
    console.log('🎓 Student:      student123 / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📍 Dashboard URLs:');
    console.log('   Admin:    http://localhost:3000/admin');
    console.log('   Teacher:  http://localhost:3000/teacher');
    console.log('   Canteen:  http://localhost:3000/canteen');
    console.log('   Junk:     http://localhost:3000/junk');
    console.log('   Student:  http://localhost:3000/student');
    console.log('');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB Atlas');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Check your internet connection');
      console.log('   MongoDB Atlas requires internet access');
    } else if (error.message.includes('Authentication failed')) {
      console.log('💡 Username or password in MONGODB_URI is incorrect');
      console.log('   Check your .env file credentials');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Connection timeout - check your network');
    }
    
    process.exit(1);
  }
}

resetDatabase();