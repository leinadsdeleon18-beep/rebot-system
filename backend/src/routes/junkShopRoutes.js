const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Junk shop dashboard' });
});

router.get('/pickups', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Pickup list' });
});

module.exports = router;