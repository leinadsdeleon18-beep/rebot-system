const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const Role = require('../src/models/Role');
const User = require('../src/models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete all existing users first
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    // Create roles
    const roles = [
      { name: 'administrator', permissions: ['all'] },
      { name: 'teacher', permissions: ['manage_students', 'redeem_rewards'] },
      { name: 'canteen_staff', permissions: ['redeem_rewards', 'manage_inventory'] },
      { name: 'junk_shop_personnel', permissions: ['manage_collections'] },
      { name: 'utility_staff', permissions: ['view_bins'] }
    ];
    
    const createdRoles = [];
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
      }
      createdRoles.push(role);
      console.log(`Role: ${roleData.name}`);
    }
    
    // Hash passwords manually
    const adminPassword = await bcrypt.hash('admin123', 10);
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const canteenPassword = await bcrypt.hash('canteen123', 10);
    const junkPassword = await bcrypt.hash('junk123', 10);
    const utilityPassword = await bcrypt.hash('utility123', 10);
    
    // Get role IDs
    const adminRole = await Role.findOne({ name: 'administrator' });
    const teacherRole = await Role.findOne({ name: 'teacher' });
    const canteenRole = await Role.findOne({ name: 'canteen_staff' });
    const junkRole = await Role.findOne({ name: 'junk_shop_personnel' });
    const utilityRole = await Role.findOne({ name: 'utility_staff' });
    
    // Create users with pre-hashed passwords
    const users = [
      { username: 'admin123', email: 'admin@rebot.ph', password: adminPassword, fullName: 'Admin User', role: adminRole._id, isActive: true },
      { username: 'teacher123', email: 'teacher@rebot.ph', password: teacherPassword, fullName: 'Maria Santos', role: teacherRole._id, isActive: true },
      { username: 'canteen123', email: 'canteen@rebot.ph', password: canteenPassword, fullName: 'Rosa Mercado', role: canteenRole._id, isActive: true },
      { username: 'junk123', email: 'junk@rebot.ph', password: junkPassword, fullName: 'Juan Reyes', role: junkRole._id, isActive: true },
      { username: 'utility123', email: 'utility@rebot.ph', password: utilityPassword, fullName: 'Utility Staff', role: utilityRole._id, isActive: true }
    ];
    
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.username}`);
    }
    
    console.log('\n=================================');
    console.log('✅ Database setup completed!');
    console.log('=================================');
    console.log('\nLogin Credentials:');
    console.log('Admin:     admin123 / admin123');
    console.log('Teacher:   teacher123 / teacher123');
    console.log('Canteen:   canteen123 / canteen123');
    console.log('Junk Shop: junk123 / junk123');
    console.log('Utility:   utility123 / utility123');
    console.log('=================================');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();