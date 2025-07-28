const express = require('express');
const router = express.Router();

// Pricing routes for testing
router.get('/', (req, res) => {
  res.json({ message: 'Pricing routes placeholder' });
});

router.get('/services', (req, res) => {
  res.json({ 
    services: [
      { id: 'screen-repair', name: 'Screen Repair', price: 149 },
      { id: 'battery-replacement', name: 'Battery Replacement', price: 89 },
      { id: 'data-recovery', name: 'Data Recovery', price: 299 }
    ] 
  });
});

module.exports = router;