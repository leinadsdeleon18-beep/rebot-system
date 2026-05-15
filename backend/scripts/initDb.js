const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Role = require('../src/models/Role');
const User = require('../src/models/User');
const Material = require('../src/models/Material');
const Reward = require('../src/models/Reward');
const RewardInventory = require('../src/models/RewardInventory');

const initDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await Role.deleteMany({});
    await User.deleteMany({});
    await Material.deleteMany({});
    await Reward.deleteMany({});
    await RewardInventory.deleteMany({});
    
    const roles = [
      { name: 'administrator', permissions: ['all'] },
      { name: 'teacher', permissions: ['manage_students', 'redeem_rewards', 'view_reports'] },
      { name: 'canteen_staff', permissions: ['redeem_rewards', 'manage_inventory', 'view_transactions'] },
      { name: 'junk_shop_personnel', permissions: ['manage_collections', 'view_bins', 'schedule_pickups'] },
      { name: 'utility_staff', permissions: ['view_bins', 'update_bin_status'] }
    ];
    
    const createdRoles = await Role.insertMany(roles);
    console.log('Roles created');
    
    const users = [
      { username: 'admin123', email: 'admin@rebot.ph', password: 'admin123', fullName: 'Admin User', role: 'administrator' },
      { username: 'teacher123', email: 'teacher@rebot.ph', password: 'teacher123', fullName: 'Maria Santos', role: 'teacher' },
      { username: 'canteen123', email: 'canteen@rebot.ph', password: 'canteen123', fullName: 'Rosa Mercado', role: 'canteen_staff' },
      { username: 'junk123', email: 'junk@rebot.ph', password: 'junk123', fullName: 'Juan Reyes', role: 'junk_shop_personnel' },
      { username: 'utility123', email: 'utility@rebot.ph', password: 'utility123', fullName: 'Utility Staff', role: 'utility_staff' }
    ];
    
    for (const userData of users) {
      const role = createdRoles.find(r => r.name === userData.role);
      await User.create({ ...userData, role: role._id, isActive: true });
    }
    console.log('Users created');
    
    const materials = [
      { name: 'PET Bottle', type: 'bottle', unit: 'piece', pointsEquivalent: 1, isActive: true },
      { name: '1.5L Bottle', type: 'bottle', unit: 'piece', pointsEquivalent: 2, isActive: true },
      { name: 'Aluminum Can', type: 'bottle', unit: 'piece', pointsEquivalent: 1, isActive: true }
    ];
    await Material.insertMany(materials);
    console.log('Materials created');
    
    const rewards = [
      { name: 'Biscuit', description: 'Delicious biscuit snack', pointsRequired: 10, category: 'snacks' },
      { name: 'Chocolate Bar', description: 'Milk chocolate bar', pointsRequired: 25, category: 'snacks' },
      { name: 'Juice Box', description: 'Fruit juice drink', pointsRequired: 15, category: 'drinks' },
      { name: 'Pencil Set', description: 'Set of 3 pencils', pointsRequired: 50, category: 'school_supplies' },
      { name: 'Notebook', description: 'Writing notebook', pointsRequired: 75, category: 'school_supplies' },
      { name: 'Eraser', description: 'White eraser', pointsRequired: 5, category: 'school_supplies' }
    ];
    
    for (const rewardData of rewards) {
      const reward = await Reward.create(rewardData);
      await RewardInventory.create({ reward: reward._id, stockQuantity: 50, lowStockThreshold: 10 });
    }
    console.log('Rewards created');
    
    console.log('\n✅ Database initialization completed!');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin123 / admin123');
    console.log('Teacher: teacher123 / teacher123');
    console.log('Canteen: canteen123 / canteen123');
    console.log('Junk Shop: junk123 / junk123');
    console.log('Utility: utility123 / utility123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

initDatabase();