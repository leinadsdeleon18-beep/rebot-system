const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bibot';

async function fixUserPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Get username from command line or use default
    const username = process.argv[2] || 'jhunnn';
    const newPassword = process.argv[3] || 'jhunnn123';
    
    console.log(`Fixing password for user: ${username}`);
    console.log(`New password will be: ${newPassword}\n`);
    
    // Find the user
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ User "${username}" not found!`);
      console.log('\nAvailable users:');
      const allUsers = await User.find().select('username');
      allUsers.forEach(u => console.log(`  - ${u.username}`));
      process.exit(1);
    }
    
    console.log('📋 Current user info:');
    console.log(`  Username: ${user.username}`);
    console.log(`  Full Name: ${user.fullName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.roleName}`);
    console.log(`  Current password hash length: ${user.password.length}`);
    console.log(`  Current password hash: ${user.password.substring(0, 30)}...`);
    
    // Set raw password - let pre-save hook hash it
    user.password = newPassword;
    await user.save();
    
    console.log('\n✅ Password updated successfully!');
    console.log(`  New hash length: ${user.password.length}`);
    
    // Verify the password works
    const isValid = await bcrypt.compare(newPassword, user.password);
    console.log(`\n🔍 Verification: Password match = ${isValid ? '✅ YES' : '❌ NO'}`);
    
    if (isValid) {
      console.log('\n🎉 SUCCESS! You can now login with:');
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  Username: ${username}`);
      console.log(`  Password: ${newPassword}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    } else {
      console.log('\n❌ Password verification failed. Trying manual hash...');
      
      // Manual hash as fallback
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      await user.save();
      
      const verifyAgain = await bcrypt.compare(newPassword, user.password);
      console.log(`Manual hash verification: ${verifyAgain ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserPassword();