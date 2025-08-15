"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataFilePath = path_1.default.join(__dirname, '../data/sap_services_portfolio.json');
function loadData() {
    try {
        const rawData = fs_1.default.readFileSync(dataFilePath, 'utf-8');
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
        console.log('SAP Services Portfolio loaded successfully:', servicesPortfolio);
        // Additional logic to process the services portfolio can be added here
    }
    else {
        console.error('Failed to load SAP Services Portfolio.');
    }
}
initializeApp();
//# sourceMappingURL=index.js.map