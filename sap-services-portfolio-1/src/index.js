import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import express from 'express';
const routes = require('./api/routes');
const app = express();
app.use('/api', routes);
const ServiceMatcher = require('../backend/service-matcher');
// ---------- Load portfolio (optional if ServiceMatcher does it internally)
const dataFilePath = path.join(__dirname, '../data/sap_services_portfolio.json');
function loadData() {
    try {
        const rawData = fs.readFileSync(dataFilePath, 'utf-8');
        const servicesPortfolio = JSON.parse(rawData);
        return servicesPortfolio;
    }
    catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}
function initializeApp() {
    const servicesPortfolio = loadData();
    if (servicesPortfolio) {
        console.log('SAP Services Portfolio loaded successfully.');
        // You can pass servicesPortfolio to other modules if needed
    }
    else {
        console.error('Failed to load SAP Services Portfolio.');
    }
}
initializeApp();
// ---------- Express Server + Matching Endpoint
const serviceMatcher = new ServiceMatcher();
app.use(express.json());
app.post('/match', async (req, res) => {
    try {
        const customerProfile = req.body;
        const result = await serviceMatcher.matchServices(customerProfile);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Matching failed:', error.message);
        }
        else {
            console.error('Matching failed:', error);
        }
        res.status(500).json({ error: 'Service matching failed.' });
    }
});
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
//# sourceMappingURL=index.js.map