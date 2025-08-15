// backend/service-matcher.js

class ServiceMatcher {
    constructor() {
      const servicesData = require('../data/sap_services_portfolio.json');
      this.services = servicesData.servicesPortfolio;
    }
  
    async matchServices(customerProfile) {
      const basicKeywords = this.extractBasicKeywords(customerProfile.customerNeeds);
      const matches = this.performKeywordMatching(basicKeywords);
      const filtered = this.applyBusinessRules(matches, customerProfile);
  
      return {
        recommendations: filtered,
        analysis: { extractedKeywords: basicKeywords },
        explanation: 'LLM is disabled. Using keyword-based matching only.',
        totalEstimatedCost: this.calculateTotalCost(filtered.slice(0, 5)),
      };
    }
  
    performKeywordMatching(keywords) {
      return this.services
        .map(service => {
          const score = this.calculateKeywordScore(keywords, service.keywords);
          return { ...service, matchScore: score };
        })
        .filter(service => service.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);
    }
  
    applyBusinessRules(matches, customerProfile) {
      const budgetLimits = {
        Foundational: 500,
        Advanced: 750,
        Max: 1200,
      };
  
      const maxRate = budgetLimits[customerProfile.budgetTier] || 1200;
  
      return matches.filter(service => {
        const dailyRate = parseInt(service.gRateOrPricingEstimate.replace(/[£,]/g, ''));
        return dailyRate <= maxRate;
      });
    }
  
    calculateKeywordScore(inputKeywords, serviceKeywords) {
      let score = 0;
      inputKeywords.forEach(keyword => {
        serviceKeywords.forEach(serviceKeyword => {
          if (
            serviceKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(serviceKeyword.toLowerCase())
          ) {
            score += 1;
          }
        });
      });
      return score;
    }
  
    extractBasicKeywords(text) {
      const commonKeywords = [
        'security',
        'monitoring',
        'deployment',
        'training',
        'support',
        'optimization',
        'implementation',
      ];
      return commonKeywords.filter(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  
    calculateTotalCost(recommended) {
      return recommended.reduce((acc, service) => {
        const dailyRate = parseInt(service.gRateOrPricingEstimate.replace(/[£,]/g, ''));
        return acc + dailyRate;
      }, 0);
    }
  }
  
  module.exports = ServiceMatcher;
  