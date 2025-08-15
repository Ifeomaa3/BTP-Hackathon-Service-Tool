require('dotenv').config(); // ✅ required to load env vars

const { OpenAI } = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async callOpenAI(messages, maxTokens = 1000) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('❌ OpenAI API Error:', error?.response?.data || error.message);
      throw error;
    }
  }

  async analyzeCustomerNeeds(customerInput, customerProfile) {
    const messages = [
      {
        role: 'system',
        content: `You are an SAP Success Plan consultant. Extract key requirements from customer input and map them to relevant SAP services.

Customer Context:
- Company: ${customerProfile.companyName}
- Industry: ${customerProfile.industry}
- SAP Solutions: ${customerProfile.cloudSolutionInUse.join(', ')}
- Budget Tier: ${customerProfile.budgetTier}

Return a JSON response with:
- extractedKeywords: array of relevant keywords
- requirementCategory: string (implementation, optimization, support, security, etc.)
- urgencyLevel: string (low, medium, high)
- suggestedQuestions: array of clarifying questions if needed`,
      },
      {
        role: 'user',
        content: customerInput,
      },
    ];

    const result = await this.callOpenAI(messages);
    return JSON.parse(result);
  }

  async generateServiceExplanation(recommendedServices, customerProfile) {
    const messages = [
      {
        role: 'system',
        content: `Generate a professional, customer-ready explanation for why these SAP services are recommended.

Make it:
- Clear and business-focused
- Specific to their industry and needs
- Include effort and pricing context
- Sound like a trusted advisor`,
      },
      {
        role: 'user',
        content: `Customer: ${customerProfile.companyName} (${customerProfile.industry})
Budget Tier: ${customerProfile.budgetTier}
Needs: ${customerProfile.customerNeeds}

Recommended Services: ${JSON.stringify(recommendedServices, null, 2)}`,
      },
    ];

    return await this.callOpenAI(messages, 1500);
  }
}

module.exports = OpenAIService;
