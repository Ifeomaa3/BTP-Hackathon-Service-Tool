// backend/service-matcher.js

class ServiceMatcher {
  constructor() {
    const servicesData = require('./data/sap_services_portfolio.json');
    this.services = servicesData.servicesPortfolio;

    // Budget caps for tiers
    this.budgetLimits = {
      Foundational: 500,
      Advanced: 750,
      Max: 1200,
    };

    // Static clarifying questions (Phase 1 fallback)
    this.questionBank = [
      { id: 'scope',   text: 'Do you need deployment support or ongoing application operations support?' },
      { id: 'area',    text: 'Which business area: HR, Finance (R2R), Procurement (P2P), or Sales (O2C)?' },
      { id: 'scale',   text: 'Is this for one region or global/multi-region?' },
      { id: 'timeline',text: 'Is it a one-off project or an ongoing managed service?' }
    ];

    // Words that are too generic to match on
    this.genericWords = new Set(['help','support','sap','system','cloud','need','please','with','project']);
  }

  // -------- Explainability helpers --------
  getMatchedKeywords(inputKeywords, serviceKeywords = []) {
    const matches = new Set();
    const svc = serviceKeywords.map(k => (k || '').toLowerCase());
    inputKeywords.forEach(k => {
      const lk = (k || '').toLowerCase();
      svc.forEach(sk => {
        if (sk.includes(lk) || lk.includes(sk)) matches.add(sk);
      });
    });
    return Array.from(matches);
  }

  buildRationale(service, matchedKeywords, tier, maxRate) {
    const daily = parseInt(String(service.gRateOrPricingEstimate || '').replace(/[£,]/g, '')) || 0;
    const parts = [];
    if (matchedKeywords && matchedKeywords.length) {
      parts.push(`Matched keywords: ${matchedKeywords.join(', ')}`);
    } else {
      parts.push('Matched based on service relevance');
    }
    parts.push(`Fits budget tier "${tier}" (rate £${daily}/day ≤ cap £${maxRate}/day)`);
    return parts.join(' • ');
  }

  needsClarification(tokens = []) {
    const nonGeneric = tokens.filter(t => !this.genericWords.has(t));
    return tokens.length < 3 || nonGeneric.length === 0;
  }

  // ------------- Core matching -------------
  async matchServices(customerProfile) {
    const needs = customerProfile.customerNeeds || '';
    const needsLower = needs.toLowerCase();
    const tokens = this.tokenize(needs);
    const tier = customerProfile.budgetTier || 'Advanced';
    const maxRate = this.budgetLimits[tier] || 1200;

    // --- Step 1: Smarter Clarification logic ---
    const vagueKeywords = new Set(['cloud', 'deployment', 'system', 'implementation', 'support', 'help']);
    const domainKeywords = new Set(['hr', 'finance', 'procurement', 'r2r', 'order', 'cash', 'p2p', 'o2c', 'hcm']);

    // Case 1: Too short (<= 3 words)
    if (tokens.length <= 3) {
      return {
        status: 'needs_clarification',
        customer: customerProfile.companyName,
        budgetTier: tier,
        clarifyingQuestions: [
          "Which business area are you focused on? (HR, Finance, Procurement, R2R, etc.)",
          "Do you need deployment support or ongoing operations support?"
        ],
        analysis: { tokens },
        explanation: 'Input too short; asking for clarification.',
      };
    }

    // Case 2: Input has vague terms but no clear business domain
    const hasVague = tokens.some(t => vagueKeywords.has(t));
    const hasDomain = tokens.some(t => domainKeywords.has(t));

    if (hasVague && !hasDomain) {
      return {
        status: 'needs_clarification',
        customer: customerProfile.companyName,
        budgetTier: tier,
        clarifyingQuestions: [
          "Is this related to HR, Finance, Procurement, or another area?",
          "Do you need deployment support or ongoing operations support?",
          "Is this for a global rollout or a single region?"
        ],
        analysis: { tokens },
        explanation: 'Request is vague and missing business domain; asking for clarification.',
      };
    }
    

    // --- Step 2: Fallback Phase 1 Clarification (only if nothing else matched) ---
    if (!hasDomain && !hasVague && this.needsClarification(tokens)) {
      return {
        status: 'needs_clarification',
        customer: customerProfile.companyName,
        budgetTier: tier,
        clarifyingQuestions: this.questionBank,
        analysis: { tokens },
        explanation: 'Input too short or too broad; asking for clarification.',
      };
    }


    // --- Step 3: Normal service matching ---
    const matches = this.performKeywordMatching(tokens);
    const filtered = this.applyBusinessRules(matches, maxRate);

    const topMatches = filtered.slice(0, 5);
    const totalEffort = this.calculateTotalEffort(topMatches);
    const totalCost = this.calculateTotalCost(topMatches);
  
    // 👉 Enrich each service with ROM estimate
    const enrichedMatches = topMatches.map(s => {
      const rate = parseFloat((s.gRateOrPricingEstimate || "").replace(/[^0-9.]/g, "")) || 0;
      const effort = s.estimatedEffortPersonDays || 0;
      const rom = rate * effort;
      return {
        ...s,
        romEstimate: `£${rom.toLocaleString()}`,
        rationale: this.buildRationale(s, s.matchedKeywords || [], tier, maxRate),
      };
    });

    return {
      status: 'ok',
      customer: customerProfile.companyName,
      budgetTier: customerProfile.budgetTier,
      recommendations: enrichedMatches,
      analysis: { extractedKeywords: tokens },
      explanation: "LLM is disabled. Using keyword-based matching only.",
      totalEffortPDs: totalEffort,
      totalEstimatedCost: `£${totalCost.toLocaleString()}`,
      scopeSummary: enrichedMatches.map(s => s.serviceName),
    };
  }
  

  performKeywordMatching(keywords) {
    return this.services
      .map(service => {
        const matchedKeywords = this.getMatchedKeywords(keywords, service.keywords || []);
        const score = matchedKeywords.length;
        return { ...service, matchScore: score, matchedKeywords };
      })
      .filter(service => service.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  applyBusinessRules(matches, maxRate) {
    return matches.filter(service => {
      const dailyRate = parseInt(String(service.gRateOrPricingEstimate || '').replace(/[£,]/g, '')) || 0;
      return dailyRate <= maxRate;
    });
  }

  // ------------- Utilities -------------
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
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }

  calculateTotalEffort(recommended) {
    return recommended.reduce((acc, service) => acc + (service.estimatedEffortPersonDays || 0), 0);
  }

  calculateTotalCost(recommended) {
    return recommended.reduce((acc, service) => {
      const dailyRate = parseInt(String(service.gRateOrPricingEstimate || '').replace(/[£,]/g, '')) || 0;
      return acc + dailyRate * (service.estimatedEffortPersonDays || 0);
    }, 0);
  }
}

module.exports = ServiceMatcher;
