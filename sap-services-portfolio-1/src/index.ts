import fs from 'fs';
import path from 'path';

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
        console.log('SAP Services Portfolio loaded successfully:', servicesPortfolio);
        // Additional logic to process the services portfolio can be added here
    } else {
        console.error('Failed to load SAP Services Portfolio.');
    }
}

initializeApp();