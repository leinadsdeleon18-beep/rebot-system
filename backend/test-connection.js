const mongoose = require('mongoose');

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/bibot', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ SUCCESS! Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // List collections
    const collections = await mongoose.connection.db.collections();
    console.log('Collections:', collections.map(c => c.collectionName));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.log('\nPlease start MongoDB first:');
    console.log('1. Open Command Prompt as Administrator');
    console.log('2. Run: net start MongoDB');
    console.log('3. Or run: "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe"');
  }
}

testConnection();