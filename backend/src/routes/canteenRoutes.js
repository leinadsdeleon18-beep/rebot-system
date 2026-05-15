const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Placeholder routes - add actual controllers later
router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Canteen dashboard' });
});

router.get('/rewards', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Canteen rewards' });
});

module.exports = router;