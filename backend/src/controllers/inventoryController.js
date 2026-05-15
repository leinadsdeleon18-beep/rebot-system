// src/controllers/inventoryController.js
const RewardInventory = require('../models/RewardInventory');
const Reward = require('../models/Reward');

const getInventory = async (req, res) => {
  try {
    const inventory = await RewardInventory.find().populate('reward');
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { stockQuantity } = req.body;
    const inventory = await RewardInventory.findOneAndUpdate(
      { reward: req.params.rewardId },
      { stockQuantity, lastRestocked: new Date() },
      { new: true }
    ).populate('reward');
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getInventory, updateStock };