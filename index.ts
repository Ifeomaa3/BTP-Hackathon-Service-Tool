// src/index.ts
const fs = require('fs');
const path = require('path');
const express = require('express');
const ServiceMatcher = require('../backend/service-matcher');

const app = express();

const dataFilePath = path.join(__dirname, '../data/sap_services_portfolio.json');

function loadData() {
  try {
    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    const servicesPortfolio = JSON.parse(rawData);
    return servicesPortfolio;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

function initializeApp() {
  const servicesPortfolio = loadData();
  if (servicesPortfolio) {
    console.log('SAP Services Portfolio loaded successfully.');
    // pass servicesPortfolio if needed
  } else {
    console.error('Failed to load SAP Services Portfolio.');
  }
}

initializeApp();

const serviceMatcher = new ServiceMatcher();

app.use(express.json());

app.post('/match-services', async (req, res) => {
  try {
    const customerProfile = req.body;
    const result = await serviceMatcher.matchServices(customerProfile);
    res.json(result);
  } catch (error) {
    console.error('Matching failed:', error);
    res.status(500).json({ error: 'Service matching failed.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
