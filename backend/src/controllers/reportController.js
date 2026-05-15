// src/controllers/reportController.js
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');

const getRecyclingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { type: 'recycling' };
    
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const transactions = await Transaction.find(query).populate('student');
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRecyclingReport };