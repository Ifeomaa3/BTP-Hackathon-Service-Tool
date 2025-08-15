const OpenAIService = require('./Openai-service');

async function test() {
  const openai = new OpenAIService();
  const res = await openai.callOpenAI([
    { role: 'user', content: 'Say: OpenAI connection working.' },
  ]);
  console.log(res);
}

test();
