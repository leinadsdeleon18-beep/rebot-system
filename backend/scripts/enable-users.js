const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function enableUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Enable all users
    const result = await usersCollection.updateMany(
      {},
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Enabled ${result.modifiedCount} users`);
    
    // List all users
    const users = await usersCollection.find({}).toArray();
    console.log('\n📋 Users:');
    users.forEach(u => {
      console.log(`   ${u.username} - isActive: ${u.isActive}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

enableUsers();