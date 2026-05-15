const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Inventory list' });
});

router.put('/:id', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Inventory updated' });
});

module.exports = router;