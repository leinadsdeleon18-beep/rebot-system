const express = require('express');
const router = express.Router();
const { 
  getSystemStats, 
  getRecentTransactions, 
  getGradeLevelPerformance,
  getBottlesPerGrade 
} = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/dashboard', getSystemStats);
router.get('/transactions', getRecentTransactions);
router.get('/points-distribution', getGradeLevelPerformance);
router.get('/bottles-per-grade', getBottlesPerGrade);

module.exports = router;