// backend/service-matcher.js

class ServiceMatcher {
  constructor() {
    const servicesData = require('./data/sap_services_portfolio.json');
    this.services = servicesData.servicesPortfolio;
  }

  async matchServices(customerProfile) {
    const extractedKeywords = this.tokenize(customerProfile.customerNeeds);
    const matches = this.performKeywordMatching(extractedKeywords);
    const filtered = this.applyBusinessRules(matches, customerProfile);
  
    const topMatches = filtered.slice(0, 5);
    const totalEffort = this.calculateTotalEffort(topMatches);
    const totalCost = this.calculateTotalCost(topMatches);
  
    // 👉 Enrich each service with ROM estimate
    const enrichedMatches = topMatches.map(s => {
      const rate = parseFloat((s.gRateOrPricingEstimate || "").replace(/[^0-9.]/g, "")) || 0;
      const effort = s.estimatedEffortPersonDays || 0;
      const total = rate * effort;
  
      return {
        ...s,
        romEstimate: total > 0 ? `£${total.toLocaleString()}` : "N/A"
      };
    });
  
    // 👉 Return enriched matches instead of topMatches
    return {
      customer: customerProfile.companyName,
      budgetTier: customerProfile.budgetTier,
      recommendations: enrichedMatches,
      analysis: { extractedKeywords },
      explanation: "LLM is disabled. Using keyword-based matching only.",
      totalEffortPDs: totalEffort,
      totalEstimatedCost: `£${totalCost.toLocaleString()}`,
      scopeSummary: enrichedMatches.map(s => s.serviceName)
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

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  }

  calculateTotalEffort(recommended) {
    return recommended.reduce((acc, service) => acc + (service.estimatedEffortPersonDays || 0), 0);
  }

  calculateTotalCost(recommended) {
    return recommended.reduce((acc, service) => {
      const dailyRate = parseInt(service.gRateOrPricingEstimate.replace(/[£,]/g, ""));
      return acc + (dailyRate * (service.estimatedEffortPersonDays || 0));
    }, 0);
  }
}

module.exports = ServiceMatcher;
