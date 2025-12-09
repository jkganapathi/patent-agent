// 📁 test-api.js - Simple API key test
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAPIKey() {
  console.log('🧪 Testing OpenAI API Key...');
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  console.log('API Key configured:', !!apiKey);
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is not set in .env.local');
    console.error('Please set OPENAI_API_KEY in your .env.local file');
    return;
  }

  console.log('API Key preview:', apiKey.substring(0, 10) + '...');

  // Get model from environment or use default
  const modelName = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  
  const model = new ChatOpenAI({
    apiKey: apiKey,
    // Using OpenAI API directly - no baseURL needed (defaults to https://api.openai.com/v1)
    model: modelName,
    temperature: 0.3,
  });
  
  console.log('Using model:', modelName);

  try {
    console.log('🔄 Making test API call...');
    const response = await model.invoke([
      new SystemMessage("You are a helpful assistant."),
      new HumanMessage("Say 'Hello World' and nothing else.")
    ]);
    
    console.log('✅ API test successful!');
    console.log('Response:', response.content);
    
  } catch (error) {
    console.error('❌ API test failed:');
    console.error('Error:', error.message);
    console.error('Status:', error.status);
    console.error('Details:', error.details);
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n🔑 This looks like an API key issue. Please check:');
      console.error('1. Your OpenAI API key is correct');
      console.error('2. The key is not truncated or encoded');
      console.error('3. You have access to OpenAI API (check your OpenAI account)');
      console.error('4. Your API key has sufficient credits');
    }
  }
}

testAPIKey(); 