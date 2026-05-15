// src/controllers/junkShopController.js
const Bin = require('../models/Bin');
const Pickup = require('../models/Pickup');

const getBins = async (req, res) => {
  try {
    const bins = await Bin.find().populate('materialType');
    res.json({ success: true, bins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const schedulePickup = async (req, res) => {
  try {
    const { binId, scheduledDate, notes } = req.body;
    const pickup = await Pickup.create({
      bin: binId,
      scheduledDate,
      notes,
      status: 'scheduled'
    });
    res.status(201).json({ success: true, pickup });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getBins, schedulePickup };