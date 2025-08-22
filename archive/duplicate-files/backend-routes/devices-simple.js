const express = require('express');
const router = express.Router();

// Device routes for testing
router.get('/', (req, res) => {
  res.json({ message: 'Device routes placeholder' });
});

router.get('/brands', (req, res) => {
  res.json({ brands: ['Apple', 'Samsung', 'HP', 'Dell'] });
});

router.get('/models', (req, res) => {
  res.json({ models: ['iPhone 15', 'MacBook Pro', 'Galaxy S24'] });
});

module.exports = router;