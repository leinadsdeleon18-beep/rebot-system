// src/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Student = require('../models/Student');

const getTransactions = async (req, res) => {
  try {
    const { studentId, type, limit = 50 } = req.query;
    const query = {};
    
    if (studentId) query.student = studentId;
    if (type) query.type = type;
    
    const transactions = await Transaction.find(query)
      .populate('student')
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRecyclingTransaction = async (req, res) => {
  try {
    const { studentId, materials } = req.body;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    let totalPoints = 0;
    // Calculate total points from materials
    for (const material of materials) {
      totalPoints += material.quantity * material.pointsPerUnit;
    }
    
    const transactionNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const transaction = await Transaction.create({
      transactionNumber,
      student: studentId,
      user: req.user._id,
      type: 'recycling',
      totalPoints,
      status: 'completed'
    });
    
    // Add points to student
    student.points += totalPoints;
    student.totalPointsEarned += totalPoints;
    await student.save();
    
    res.status(201).json({ success: true, transaction, student });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getTransactions, createRecyclingTransaction };