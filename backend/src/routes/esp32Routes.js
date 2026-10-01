const Device = require('../models/Device');

router.post('/update-count', async (req, res) => {
  try {
    const { device_id, bottle_count } = req.body;
    if (!device_id || typeof bottle_count !== 'number' || bottle_count < 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId: device_id },
      { deviceId: device_id, bottleCount: bottle_count, lastSeen: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (global.io) {
      global.io.emit('bottle-count-updated', {
        deviceId: device_id,
        bottleCount: bottle_count,
        timestamp: Date.now()
      });
    }

    console.log(`📦 ${device_id} count = ${bottle_count}`);
    res.json({ success: true, bottleCount: device.bottleCount });
  } catch (err) {
    console.error('update-count error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});