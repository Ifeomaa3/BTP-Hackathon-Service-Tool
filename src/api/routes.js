// src/api/routes.js
const express = require('express');
const ServiceMatcher = require('../../../backend/service-matcher');

const router = express.Router();
const matcher = new ServiceMatcher();

router.post('/match-services', async (req, res) => {
  try {
    const customerProfile = req.body;
    const results = await matcher.matchServices(customerProfile);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
