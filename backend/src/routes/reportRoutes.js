const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getReportData,
  getRecyclingData,
  getRedemptionData
} = require('../controllers/reportController');

const router = express.Router();

router.get('/data', authMiddleware, getReportData);
router.get('/recycling', authMiddleware, getRecyclingData);
router.get('/redemption', authMiddleware, getRedemptionData);

module.exports = router;