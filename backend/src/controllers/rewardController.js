const Reward = require('../models/Reward');
const RewardInventory = require('../models/RewardInventory'); // This will use 'reward_inventory'
const Transaction = require('../models/Transaction');
const Redemption = require('../models/Redemption');
const Student = require('../models/Student');

const getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find({ isActive: true });
    const rewardsWithStock = await Promise.all(rewards.map(async (reward) => {
      // Use reward_inventory collection
      const inventory = await RewardInventory.findOne({ reward: reward._id });
      return { 
        ...reward.toObject(), 
        stock: inventory ? inventory.stockQuantity : 0, 
        lowStockThreshold: inventory ? inventory.lowStockThreshold : 10 
      };
    }));
    res.json({ success: true, rewards: rewardsWithStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const redeemReward = async (req, res) => {
  try {
    const { studentId, rewardId, quantity = 1 } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    const reward = await Reward.findById(rewardId);
    if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
    
    // Use reward_inventory collection
    const inventory = await RewardInventory.findOne({ reward: rewardId });
    if (!inventory || inventory.stockQuantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }
    
    const pointsRequired = reward.pointsRequired * quantity;
    if (student.points < pointsRequired) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }
    
    const transactionNumber = `RDM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const transaction = await Transaction.create({
      transactionNumber,
      student: studentId,
      user: req.user._id,
      type: 'redemption',
      totalPoints: pointsRequired,
      status: 'completed'
    });
    
    await Redemption.create({
      transaction: transaction._id,
      reward: rewardId,
      quantity,
      pointsUsed: pointsRequired
    });
    
    student.points -= pointsRequired;
    await student.save();
    
    inventory.stockQuantity -= quantity;
    await inventory.save();
    
    res.json({ 
      success: true, 
      message: `${reward.name} redeemed successfully!`,
      transaction,
      remainingPoints: student.points
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRewards,
  getRewardById: async (req, res) => {
    try {
      const reward = await Reward.findById(req.params.id);
      if (!reward) return res.status(404).json({ success: false, message: 'Reward not found' });
      const inventory = await RewardInventory.findOne({ reward: reward._id });
      res.json({ success: true, reward: { ...reward.toObject(), stock: inventory ? inventory.stockQuantity : 0 } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  createReward: async (req, res) => {
    try {
      const { name, description, pointsRequired, category, image } = req.body;
      const reward = await Reward.create({ name, description, pointsRequired, category, image });
      await RewardInventory.create({ reward: reward._id, stockQuantity: 0, lowStockThreshold: 10 });
      res.status(201).json({ success: true, reward });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  updateReward: async (req, res) => {
    try {
      const reward = await Reward.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, reward });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  deleteReward: async (req, res) => {
    try {
      await Reward.findByIdAndDelete(req.params.id);
      await RewardInventory.findOneAndDelete({ reward: req.params.id });
      res.json({ success: true, message: 'Reward deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  getInventory: async (req, res) => {
    try {
      const inventory = await RewardInventory.find().populate('reward');
      res.json({ success: true, inventory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateInventory: async (req, res) => {
    try {
      const { stockQuantity } = req.body;
      const inventory = await RewardInventory.findOneAndUpdate(
        { reward: req.params.rewardId },
        { stockQuantity, lastRestocked: new Date(), updatedAt: new Date() },
        { new: true }
      ).populate('reward');
      res.json({ success: true, inventory });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  redeemReward
};