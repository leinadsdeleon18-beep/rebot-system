const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Teacher dashboard' });
});

router.get('/students', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Teacher students' });
});

module.exports = router;