const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Role = require('../src/models/Role');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bibot';

async function migrateRoleName() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Find all users without roleName or with null roleName
    const users = await User.find({
      $or: [
        { roleName: { $exists: false } },
        { roleName: null },
        { roleName: '' }
      ]
    });
    
    console.log(`Found ${users.length} users missing roleName\n`);
    
    for (const user of users) {
      console.log(`Processing: ${user.username}`);
      
      // Get role name from the role reference
      if (user.role) {
        const roleDoc = await Role.findById(user.role);
        if (roleDoc) {
          user.roleName = roleDoc.name;
          await user.save();
          console.log(`  ✅ Updated roleName to: ${roleDoc.name}`);
        } else {
          console.log(`  ❌ Role not found for ID: ${user.role}`);
          // Set default role
          user.roleName = 'teacher';
          await user.save();
          console.log(`  ⚠️ Set default roleName to: teacher`);
        }
      } else {
        console.log(`  ❌ No role reference found`);
        user.roleName = 'teacher';
        await user.save();
        console.log(`  ⚠️ Set default roleName to: teacher`);
      }
    }
    
    // Verify all users now have roleName
    const allUsers = await User.find().select('username roleName role');
    console.log('\n📋 All users after migration:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username}: roleName="${user.roleName}", roleId=${user.role}`);
    });
    
    console.log('\n✨ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrateRoleName();