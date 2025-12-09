// 📁 lib/langgraph-config.js
import { StateGraph, END } from '@langchain/langgraph';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// =============================================================================
// UNIFIED AI PROVIDER INTERFACE
// Supports OpenAI, Google Gemini, and Groq with automatic fallback
// =============================================================================

class UnifiedAIProvider {
  constructor() {
    // Initialize providers
    this.providers = {
      openai: null,
      gemini: null,
      groq: null
    };
    
    // Provider priority order (will try in this order)
    this.providerOrder = [];
    
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY) {
      this.providers.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY,
      });
      this.providerOrder.push('openai');
      console.log('✅ OpenAI provider initialized');
    }
    
    // Initialize Gemini
    if (process.env.GEMINI_API_KEY) {
      this.providers.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.providerOrder.push('gemini');
      console.log('✅ Gemini provider initialized');
    }
    
    // Initialize Groq
    if (process.env.GROQ_API_KEY) {
      this.providers.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      this.providerOrder.push('groq');
      console.log('✅ Groq provider initialized');
    }
    
    if (this.providerOrder.length === 0) {
      console.warn('⚠️ No AI providers configured. Please set at least one API key.');
    } else {
      console.log(`✅ ${this.providerOrder.length} AI provider(s) available: ${this.providerOrder.join(', ')}`);
    }
  }
  
  async chatCompletion(messages, options = {}) {
    const {
      model = null,
      temperature = 0.3,
      max_tokens = 2000,
      provider = null // Force specific provider, or null for auto-fallback
    } = options;
    
    // Determine which providers to try
    const providersToTry = provider 
      ? [provider] 
      : this.providerOrder;
    
    let lastError = null;
    
    // Try each provider in order
    for (const providerName of providersToTry) {
      try {
        console.log(`🔄 Trying ${providerName} provider...`);
        
        switch (providerName) {
          case 'openai':
            return await this._openaiChat(messages, { 
              model: model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo', 
              temperature, 
              max_tokens 
            });
          
          case 'gemini':
            return await this._geminiChat(messages, { 
              model: model || process.env.GEMINI_MODEL || 'gemini-pro', 
              temperature, 
              max_tokens 
            });
          
          case 'groq':
            return await this._groqChat(messages, { 
              model: model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant', 
              temperature, 
              max_tokens 
            });
          
          default:
            throw new Error(`Unknown provider: ${providerName}`);
        }
      } catch (error) {
        lastError = error;
        const errorMsg = error.message || String(error);
        console.warn(`❌ ${providerName} failed:`, errorMsg);
        
        // Don't retry on quota/auth errors
        if (errorMsg.includes('quota') || errorMsg.includes('429') || 
            errorMsg.includes('401') || errorMsg.includes('403')) {
          console.log(`⏭️ Skipping ${providerName} due to quota/auth error`);
          continue;
        }
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed
    throw lastError || new Error('All AI providers failed');
  }
  
  async _openaiChat(messages, options) {
    if (!this.providers.openai) {
      throw new Error('OpenAI provider not initialized');
    }
    
    const completion = await this.providers.openai.chat.completions.create({
      model: options.model,
      messages: messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens
    });
    
    return {
      content: completion.choices[0].message.content,
      provider: 'openai',
      model: options.model
    };
  }
  
  async _geminiChat(messages, options) {
    if (!this.providers.gemini) {
      throw new Error('Gemini provider not initialized');
    }
    
    // Convert messages format for Gemini
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role === 'user');
    
    let prompt = '';
    if (systemMessage) {
      prompt += `${systemMessage.content}\n\n`;
    }
    userMessages.forEach(msg => {
      prompt += `${msg.content}\n\n`;
    });
    
    const model = this.providers.gemini.getGenerativeModel({ 
      model: options.model,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.max_tokens,
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      content: response.text(),
      provider: 'gemini',
      model: options.model
    };
  }
  
  async _groqChat(messages, options) {
    if (!this.providers.groq) {
      throw new Error('Groq provider not initialized');
    }
    
    const completion = await this.providers.groq.chat.completions.create({
      model: options.model,
      messages: messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens
    });
    
    return {
      content: completion.choices[0].message.content,
      provider: 'groq',
      model: options.model
    };
  }
}

// Initialize unified AI provider
const aiProvider = new UnifiedAIProvider();

// =============================================================================
// FUTURE ENHANCEMENTS - Advanced Features
// =============================================================================

// 1. Caching System for Performance Optimization
class AgentCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
    this.ttl = 24 * 60 * 60 * 1000; // 24 hours
  }

  generateKey(agentName, input) {
    return `${agentName}_${Buffer.from(JSON.stringify(input)).toString('base64').substring(0, 50)}`;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// 2. Performance Monitoring System
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      agentExecutions: new Map(),
      totalExecutionTime: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageResponseTime: 0
    };
  }

  startTimer(agentName) {
    return {
      agentName,
      startTime: Date.now()
    };
  }

  endTimer(timer, success = true) {
    const executionTime = Date.now() - timer.startTime;
    
    if (!this.metrics.agentExecutions.has(timer.agentName)) {
      this.metrics.agentExecutions.set(timer.agentName, {
        totalExecutions: 0,
        totalTime: 0,
        averageTime: 0,
        successCount: 0,
        failureCount: 0
      });
    }
    
    const agentMetrics = this.metrics.agentExecutions.get(timer.agentName);
    agentMetrics.totalExecutions++;
    agentMetrics.totalTime += executionTime;
    agentMetrics.averageTime = agentMetrics.totalTime / agentMetrics.totalExecutions;
    
    if (success) {
      agentMetrics.successCount++;
      this.metrics.successfulExecutions++;
    } else {
      agentMetrics.failureCount++;
      this.metrics.failedExecutions++;
    }
    
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.averageResponseTime = this.metrics.totalExecutionTime / 
      (this.metrics.successfulExecutions + this.metrics.failedExecutions);
    
    return executionTime;
  }

  getMetrics() {
    return {
      ...this.metrics,
      agentExecutions: Object.fromEntries(this.metrics.agentExecutions)
    };
  }

  reset() {
    this.metrics = {
      agentExecutions: new Map(),
      totalExecutionTime: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageResponseTime: 0
    };
  }
}

// Helper function to format error messages
function formatErrorMessage(error, agentName) {
  const errorMessage = error.message || String(error);
  const statusCode = error.status || error.statusCode || error.response?.status;
  
  // Handle specific error types
  if (statusCode === 429 || errorMessage.includes('quota') || errorMessage.includes('429')) {
    return `${agentName} Error: API quota exceeded. Please check your OpenAI billing and plan at https://platform.openai.com/account/billing. You may need to add payment method or wait for quota reset.`;
  }
  
  if (statusCode === 401 || errorMessage.includes('401')) {
    return `${agentName} Error: Invalid API key. Please check your OPENAI_API_KEY in .env.local`;
  }
  
  if (statusCode === 403 || errorMessage.includes('403')) {
    return `${agentName} Error: ${errorMessage}. Please check your OpenAI account access and billing settings.`;
  }
  
  return `${agentName} Error: ${errorMessage}`;
}

// 3. Advanced Error Recovery System
class ErrorRecovery {
  constructor() {
    this.retryStrategies = new Map();
    this.maxRetries = 3;
    this.backoffMultiplier = 2;
  }

  async executeWithRetry(agentFunction, state, agentName) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await agentFunction(state);
      } catch (error) {
        lastError = error;
        const statusCode = error.status || error.statusCode || error.response?.status;
        const errorMessage = error.message || String(error);
        
        // Don't retry on quota/billing errors (429) or auth errors (401)
        if (statusCode === 429 || statusCode === 401 || errorMessage.includes('quota')) {
          console.log(`❌ ${agentName} failed with non-retryable error:`, errorMessage);
          throw error;
        }
        
        console.log(`❌ ${agentName} attempt ${attempt} failed:`, errorMessage);
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(this.backoffMultiplier, attempt) * 1000;
          console.log(`⏳ Retrying ${agentName} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Try alternative prompt strategy
          if (attempt === 2) {
            console.log(`🔄 Trying alternative prompt for ${agentName}...`);
            state = { ...state, useAlternativePrompt: true };
          }
        }
      }
    }
    
    throw lastError;
  }

  async executeWithFallback(primaryFunction, fallbackFunction, state, agentName) {
    try {
      return await primaryFunction(state);
    } catch (error) {
      console.log(`⚠️ Primary ${agentName} failed, trying fallback...`);
      try {
        return await fallbackFunction(state);
      } catch (fallbackError) {
        console.error(`❌ Both primary and fallback ${agentName} failed`);
        throw fallbackError;
      }
    }
  }
}

// 4. Parallel Execution Manager
class ParallelExecutionManager {
  constructor() {
    this.maxConcurrent = 3;
    this.queue = [];
    this.running = 0;
  }

  async executeParallel(agents, state) {
    const results = {};
    const promises = [];
    
    for (const [agentName, agentFunction] of Object.entries(agents)) {
      const promise = this.executeWithConcurrencyLimit(agentName, agentFunction, state)
        .then(result => {
          results[agentName] = result;
          return { agentName, result };
        });
      promises.push(promise);
    }
    
    await Promise.all(promises);
    return results;
  }

  async executeWithConcurrencyLimit(agentName, agentFunction, state) {
    if (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.running++;
    try {
      return await agentFunction(state);
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}

// 5. Initialize Enhancement Systems
const cache = new AgentCache();
const monitor = new PerformanceMonitor();
const errorRecovery = new ErrorRecovery();
const parallelManager = new ParallelExecutionManager();

// Define the state type
const stateType = {
  abstract: { value: '' },
  priorArt: { value: [] },
  noveltyAnalysis: { value: '' },
  patentDraft: { value: '' },
  diagrams: { value: [] },
  claims: { value: [] },
  errors: { value: [] },
  currentStep: { value: '' },
  // Enhancement fields
  cacheKey: { value: '' },
  executionMetrics: { value: {} },
  retryCount: { value: 0 },
  parallelResults: { value: {} }
};

// Enhanced Agent 1: Search Agent with Caching and Monitoring
export async function searchGenerationAgent(state) {
  const timer = monitor.startTimer('search');
  
  try {
    console.log('🔍 Search Agent: Starting prior art search...');
    
    // Check cache first
    const cacheKey = cache.generateKey('search', state.abstract);
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('✅ Search Agent: Using cached result');
      monitor.endTimer(timer, true);
      return {
        ...state,
        priorArt: cachedResult,
        currentStep: 'search_completed',
        cacheKey: cacheKey
      };
    }
    
    console.log('🔍 Search Agent: Abstract received:', state.abstract ? state.abstract.substring(0, 100) + '...' : 'NO ABSTRACT');
    
    // Use alternative prompt if retrying
    const searchPrompt = state.useAlternativePrompt ? 
      `Find relevant prior art for this invention. Return as JSON array with title, patent number, relevance, summary, date, similarity score, and source. Invention: ${state.abstract}` :
      `You are an expert patent researcher specializing in prior art discovery. 
    
    Analyze the following invention abstract and conduct a comprehensive prior art search. 
    Focus on finding the most relevant patents, publications, and technical documents that could affect patentability.
    
    Return your findings as a JSON array with this exact structure:
    [
      {
        "title": "Patent/Publication Title",
        "patent": "Patent Number (if applicable)",
        "relevance": "High/Medium/Low",
        "summary": "Brief summary of the prior art and its relevance",
        "date": "Publication/Patent Date",
        "similarity_score": "0-100",
        "source": "Database/Source where found"
      }
    ]
    
    Invention Abstract: ${state.abstract}
    
    Return only valid JSON, no additional text.`;

    console.log('🔍 Search Agent: Making API call...');
    
    const result = await aiProvider.chatCompletion([
      {
        role: "system",
        content: "You are a patent research expert. Always respond with valid JSON only."
      },
      {
        role: "user",
        content: searchPrompt
      }
    ], {
      temperature: 0.3,
      max_tokens: 2000
    });

    const response = result.content;
    console.log(`✅ Search Agent: Using ${result.provider} (${result.model})`);
    console.log('🔍 Search Agent: API response received, length:', response.length);
    console.log('🔍 Search Agent: Response preview:', response.substring(0, 200) + '...');
    
    // Extract JSON from response (handle markdown formatting)
    let jsonMatch = response.match(/\[[\s\S]*\]/);
    let priorArt;
    
    if (jsonMatch) {
      try {
        priorArt = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Fallback: try parsing the entire response
        priorArt = JSON.parse(response);
      }
    } else {
      // If no array found, try parsing the entire response
      priorArt = JSON.parse(response);
    }
    
    console.log('🔍 Search Agent: Parsed prior art, count:', priorArt.length);
    
    // Cache the result
    cache.set(cacheKey, priorArt);
    
    monitor.endTimer(timer, true);
    return {
      ...state,
      priorArt: priorArt,
      currentStep: 'search_completed',
      cacheKey: cacheKey
    };
  } catch (error) {
    console.error('❌ Search Agent Error:', error);
    console.error('❌ Search Agent Error Stack:', error.stack);
    monitor.endTimer(timer, false);
    const formattedError = formatErrorMessage(error, 'Search Agent');
    return {
      ...state,
      errors: [...state.errors, formattedError],
      currentStep: 'search_failed'
    };
  }
}

// Enhanced Agent 2: Research Agent with Parallel Processing
export async function researchGenerationAgent(state) {
  const timer = monitor.startTimer('research');
  
  try {
    console.log('📊 Research Agent: Analyzing novelty and patentability...');
    
    const researchPrompt = `You are an expert patent attorney specializing in novelty analysis and patentability assessment.
    
    Analyze the following invention abstract and prior art findings for patentability and novelty.
    
    Invention Abstract: ${state.abstract}
    
    Prior Art Found: ${JSON.stringify(state.priorArt, null, 2)}
    
    Provide a comprehensive analysis including:
    1. Novelty Assessment: Is the invention novel compared to prior art?
    2. Key Differentiators: What makes this invention unique?
    3. Patentability Score: Rate from 1-10 with explanation
    4. Potential Claims: Suggest 3-5 broad claim categories
    5. Risk Assessment: What are the main patentability risks?
    6. Recommendations: What should be modified to improve patentability?
    
    Format your response as structured text that can be easily understood by inventors and patent professionals.`;

    const result = await aiProvider.chatCompletion([
      {
        role: "system",
        content: "You are a patent attorney expert in novelty analysis. Provide clear, actionable insights."
      },
      {
        role: "user",
        content: researchPrompt
      }
    ], {
      temperature: 0.4,
      max_tokens: 1500
    });

    const analysis = result.content;
    console.log(`✅ Research Agent: Using ${result.provider} (${result.model})`);

    monitor.endTimer(timer, true);
    return {
      ...state,
      noveltyAnalysis: analysis,
      currentStep: 'research_completed'
    };
  } catch (error) {
    console.error('❌ Research Agent Error:', error);
    monitor.endTimer(timer, false);
    const formattedError = formatErrorMessage(error, 'Research Agent');
    return {
      ...state,
      errors: [...state.errors, formattedError],
      currentStep: 'research_failed'
    };
  }
}

// Enhanced Agent 3: Claims Agent with Error Recovery
export async function claimsGenerationAgent(state) {
  const timer = monitor.startTimer('claims');
  
  try {
    console.log('⚖️ Claims Agent: Generating patent claims...');
    
    const claimsPrompt = `You are an expert patent attorney specializing in claim drafting.
    
    Based on the invention abstract and novelty analysis, generate comprehensive patent claims.
    
    Invention Abstract: ${state.abstract}
    Novelty Analysis: ${state.noveltyAnalysis}
    
    Generate claims in this exact JSON format:
    [
      {
        "claim_number": 1,
        "claim_type": "Independent/Dependent",
        "claim_text": "Full claim text following USPTO format",
        "scope": "Broad/Medium/Narrow",
        "key_elements": ["element1", "element2", "element3"]
      }
    ]
    
    Include:
    - 1-2 independent claims (broad scope)
    - 3-5 dependent claims (narrower scope)
    - Claims that cover the core invention and variations
    - Claims that are defensible but not overly broad
    
    Return only valid JSON, no additional text.`;

    const result = await aiProvider.chatCompletion([
      {
        role: "system",
        content: "You are a patent attorney expert in claim drafting. Always respond with valid JSON only."
      },
      {
        role: "user",
        content: claimsPrompt
      }
    ], {
      temperature: 0.3,
      max_tokens: 2000
    });

    const response = result.content;
    console.log(`✅ Claims Agent: Using ${result.provider} (${result.model})`);
    
    // Extract JSON from response (handle markdown formatting)
    let jsonMatch = response.match(/\[[\s\S]*\]/);
    let claims;
    
    if (jsonMatch) {
      try {
        claims = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Fallback: try parsing the entire response
        claims = JSON.parse(response);
      }
    } else {
      // If no array found, try parsing the entire response
      claims = JSON.parse(response);
    }

    monitor.endTimer(timer, true);
    return {
      ...state,
      claims: claims,
      currentStep: 'claims_completed'
    };
  } catch (error) {
    console.error('❌ Claims Agent Error:', error);
    monitor.endTimer(timer, false);
    const formattedError = formatErrorMessage(error, 'Claims Agent');
    return {
      ...state,
      errors: [...state.errors, formattedError],
      currentStep: 'claims_failed'
    };
  }
}

// Enhanced Agent 4: Document Agent
export async function documentGenerationAgent(state) {
  const timer = monitor.startTimer('document');
  
  try {
    console.log('📝 Document Agent: Generating patent application...');
    
    const documentPrompt = `You are an expert patent attorney specializing in patent application drafting.
    
    Generate a complete, USPTO-compliant patent application based on the provided information.
    
    Invention Abstract: ${state.abstract}
    Prior Art: ${JSON.stringify(state.priorArt, null, 2)}
    Novelty Analysis: ${state.noveltyAnalysis}
    Claims: ${JSON.stringify(state.claims, null, 2)}
    
    Create a comprehensive patent application with these sections:
    
    1. TITLE
    2. ABSTRACT
    3. FIELD OF THE INVENTION
    4. BACKGROUND OF THE INVENTION
    5. SUMMARY OF THE INVENTION
    6. BRIEF DESCRIPTION OF THE DRAWINGS
    7. DETAILED DESCRIPTION OF THE INVENTION
    8. CLAIMS (use the generated claims)
    9. INDUSTRIAL APPLICABILITY
    
    Format the document professionally with proper patent terminology and structure.
    Make it ready for filing with the USPTO.`;

    const result = await aiProvider.chatCompletion([
      {
        role: "system",
        content: "You are an expert patent attorney. Generate professional, USPTO-compliant patent applications."
      },
      {
        role: "user",
        content: documentPrompt
      }
    ], {
      temperature: 0.3,
      max_tokens: 4000
    });

    const patentDraft = result.content;
    console.log(`✅ Document Agent: Using ${result.provider} (${result.model})`);

    monitor.endTimer(timer, true);
    return {
      ...state,
      patentDraft: patentDraft,
      currentStep: 'document_completed'
    };
  } catch (error) {
    console.error('❌ Document Agent Error:', error);
    monitor.endTimer(timer, false);
    const formattedError = formatErrorMessage(error, 'Document Agent');
    return {
      ...state,
      errors: [...state.errors, formattedError],
      currentStep: 'document_failed'
    };
  }
}

// Enhanced Agent 5: Diagram Agent
export async function diagramGenerationAgent(state) {
  const timer = monitor.startTimer('diagram');
  
  try {
    console.log('🎨 Diagram Agent: Generating diagram suggestions...');
    
    const diagramPrompt = `You are an expert patent illustrator and technical diagram specialist.
    
    Based on the invention abstract and patent application, suggest technical diagrams that should be included.
    
    Invention Abstract: ${state.abstract}
    Patent Application: ${state.patentDraft.substring(0, 2000)}...
    
    Generate diagram suggestions in this exact JSON format:
    [
      {
        "diagram_number": 1,
        "title": "Diagram Title",
        "type": "Flowchart/Block Diagram/System Architecture/Process Flow/Component Diagram",
        "description": "Detailed description of what the diagram should show",
        "key_elements": ["element1", "element2", "element3"],
        "purpose": "Why this diagram is needed for the patent"
      }
    ]
    
    Suggest 3-5 diagrams that would strengthen the patent application.
    Focus on diagrams that illustrate the invention's unique features and technical implementation.
    
    Return only valid JSON, no additional text.`;

    const result = await aiProvider.chatCompletion([
      {
        role: "system",
        content: "You are a patent illustration expert. Always respond with valid JSON only."
      },
      {
        role: "user",
        content: diagramPrompt
      }
    ], {
      temperature: 0.3,
      max_tokens: 1500
    });

    const response = result.content;
    console.log(`✅ Diagram Agent: Using ${result.provider} (${result.model})`);
    
    // Extract JSON from response (handle markdown formatting)
    let jsonMatch = response.match(/\[[\s\S]*\]/);
    let diagrams;
    
    if (jsonMatch) {
      try {
        diagrams = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Fallback: try parsing the entire response
        diagrams = JSON.parse(response);
      }
    } else {
      // If no array found, try parsing the entire response
      diagrams = JSON.parse(response);
    }

    monitor.endTimer(timer, true);
    return {
      ...state,
      diagrams: diagrams,
      currentStep: 'diagram_completed'
    };
  } catch (error) {
    console.error('❌ Diagram Agent Error:', error);
    monitor.endTimer(timer, false);
    const formattedError = formatErrorMessage(error, 'Diagram Agent');
    return {
      ...state,
      errors: [...state.errors, formattedError],
      currentStep: 'diagram_failed'
    };
  }
}

// Enhanced Workflow with Parallel Execution
export async function executeParallelWorkflow(abstract) {
  console.log('🚀 Starting Enhanced Parallel Patent Creation Workflow...');
  
  const initialState = {
    abstract: abstract,
    priorArt: [],
    noveltyAnalysis: '',
    patentDraft: '',
    diagrams: [],
    claims: [],
    errors: [],
    currentStep: 'started'
  };

  // Execute independent agents in parallel
  const parallelAgents = {
    search: searchGenerationAgent,
    research: researchGenerationAgent
  };

  try {
    const parallelResults = await parallelManager.executeParallel(parallelAgents, initialState);
    
    // Combine results and continue with dependent agents
    let state = {
      ...initialState,
      priorArt: parallelResults.search.priorArt || [],
      noveltyAnalysis: parallelResults.research.noveltyAnalysis || '',
      parallelResults: parallelResults
    };

    // Execute dependent agents sequentially
    state = await claimsGenerationAgent(state);
    state = await documentGenerationAgent(state);
    state = await diagramGenerationAgent(state);

    return {
      success: true,
      data: state,
      metrics: monitor.getMetrics(),
      message: 'Enhanced parallel workflow completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metrics: monitor.getMetrics(),
      message: 'Enhanced parallel workflow failed'
    };
  }
}

// Enhanced Workflow with Error Recovery
export async function executeRobustWorkflow(abstract) {
  console.log('🛡️ Starting Robust Patent Creation Workflow...');
  
  const initialState = {
    abstract: abstract,
    priorArt: [],
    noveltyAnalysis: '',
    patentDraft: '',
    diagrams: [],
    claims: [],
    errors: [],
    currentStep: 'started',
    retryCount: 0
  };

  try {
    // Execute with retry and fallback mechanisms
    let state = await errorRecovery.executeWithRetry(searchGenerationAgent, initialState, 'Search Agent');
    state = await errorRecovery.executeWithRetry(researchGenerationAgent, state, 'Research Agent');
    state = await errorRecovery.executeWithRetry(claimsGenerationAgent, state, 'Claims Agent');
    state = await errorRecovery.executeWithRetry(documentGenerationAgent, state, 'Document Agent');
    state = await errorRecovery.executeWithRetry(diagramGenerationAgent, state, 'Diagram Agent');

    return {
      success: true,
      data: state,
      metrics: monitor.getMetrics(),
      message: 'Robust workflow completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metrics: monitor.getMetrics(),
      message: 'Robust workflow failed'
    };
  }
}

// Create the workflow graph
export function createPatentWorkflow() {
  const workflow = new StateGraph({
    channels: stateType
  });

  // Add nodes for each agent
  workflow.addNode('search', searchGenerationAgent);
  workflow.addNode('research', researchGenerationAgent);
  workflow.addNode('claims_gen', claimsGenerationAgent);
  workflow.addNode('document_gen', documentGenerationAgent);
  workflow.addNode('diagram_gen', diagramGenerationAgent);

  // Define the workflow flow
  workflow.addEdge('search', 'research');
  workflow.addEdge('research', 'claims_gen');
  workflow.addEdge('claims_gen', 'document_gen');
  workflow.addEdge('document_gen', 'diagram_gen');
  workflow.addEdge('diagram_gen', END);

  // Add conditional edges for error handling
  workflow.addConditionalEdges(
    'search',
    (state) => state.currentStep === 'search_failed' ? END : 'research'
  );
  
  workflow.addConditionalEdges(
    'research',
    (state) => state.currentStep === 'research_failed' ? END : 'claims_gen'
  );
  
  workflow.addConditionalEdges(
    'claims_gen',
    (state) => state.currentStep === 'claims_failed' ? END : 'document_gen'
  );
  
  workflow.addConditionalEdges(
    'document_gen',
    (state) => state.currentStep === 'document_failed' ? END : 'diagram_gen'
  );

  return workflow.compile();
}

// Enhanced execute function with multiple execution modes
export async function executePatentWorkflow(abstract, mode = 'standard') {
  try {
    console.log('🚀 Starting Patent Creation Workflow...');
    console.log('Abstract length:', abstract.length);
    console.log('Execution mode:', mode);
    
    // Reset metrics for new execution
    monitor.reset();
    
    let result;
    
    switch (mode) {
      case 'parallel':
        result = await executeParallelWorkflow(abstract);
        break;
      case 'robust':
        result = await executeRobustWorkflow(abstract);
        break;
      case 'cached':
        // Check if we have a cached result for the entire workflow
        const workflowCacheKey = cache.generateKey('workflow', abstract);
        const cachedWorkflow = cache.get(workflowCacheKey);
        if (cachedWorkflow) {
          console.log('✅ Using cached workflow result');
          return {
            success: true,
            data: cachedWorkflow,
            message: 'Cached workflow result retrieved'
          };
        }
        // Fall through to standard execution
      default:
        // Use direct agent execution for reliable results
        console.log('🔄 Executing agents directly for reliable results...');
        
        let state = {
          abstract: abstract,
          priorArt: [],
          noveltyAnalysis: '',
          patentDraft: '',
          diagrams: [],
          claims: [],
          errors: [],
          currentStep: 'started'
        };

        // Helper function to check for quota errors and stop early
        const hasQuotaError = (state) => {
          return state.errors?.some(err => 
            err.includes('quota') || err.includes('429') || err.includes('exceeded')
          );
        };

        // Execute each agent sequentially with proper state passing and rate limiting
        console.log('🔍 Executing Search Agent...');
        const searchState = await searchGenerationAgent(state);
        console.log('📊 Search Agent completed:', {
          priorArtCount: searchState.priorArt?.length || 0,
          currentStep: searchState.currentStep,
          errors: searchState.errors?.length || 0
        });
        
        // Check for quota error and stop early
        if (hasQuotaError(searchState)) {
          console.error('❌ Quota error detected, stopping workflow');
          return {
            success: false,
            data: searchState,
            error: 'API quota exceeded. Please check your OpenAI billing.',
            message: 'Workflow stopped due to quota error'
          };
        }
        
        // Add delay between agents to help with rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('📊 Executing Research Agent...');
        const researchState = await researchGenerationAgent(searchState);
        console.log('📊 Research Agent completed:', {
          hasNoveltyAnalysis: !!researchState.noveltyAnalysis,
          currentStep: researchState.currentStep,
          errors: researchState.errors?.length || 0
        });
        
        if (hasQuotaError(researchState)) {
          console.error('❌ Quota error detected, stopping workflow');
          return {
            success: false,
            data: researchState,
            error: 'API quota exceeded. Please check your OpenAI billing.',
            message: 'Workflow stopped due to quota error'
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('⚖️ Executing Claims Agent...');
        const claimsState = await claimsGenerationAgent(researchState);
        console.log('⚖️ Claims Agent completed:', {
          claimsCount: claimsState.claims?.length || 0,
          currentStep: claimsState.currentStep,
          errors: claimsState.errors?.length || 0
        });
        
        if (hasQuotaError(claimsState)) {
          console.error('❌ Quota error detected, stopping workflow');
          return {
            success: false,
            data: claimsState,
            error: 'API quota exceeded. Please check your OpenAI billing.',
            message: 'Workflow stopped due to quota error'
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('📝 Executing Document Agent...');
        const documentState = await documentGenerationAgent(claimsState);
        console.log('📝 Document Agent completed:', {
          hasPatentDraft: !!documentState.patentDraft,
          currentStep: documentState.currentStep,
          errors: documentState.errors?.length || 0
        });
        
        if (hasQuotaError(documentState)) {
          console.error('❌ Quota error detected, stopping workflow');
          return {
            success: false,
            data: documentState,
            error: 'API quota exceeded. Please check your OpenAI billing.',
            message: 'Workflow stopped due to quota error'
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('🎨 Executing Diagram Agent...');
        const finalState = await diagramGenerationAgent(documentState);
        console.log('🎨 Diagram Agent completed:', {
          diagramsCount: finalState.diagrams?.length || 0,
          currentStep: finalState.currentStep,
          errors: finalState.errors?.length || 0
        });

        console.log('✅ Direct agent execution completed successfully');
        console.log('📊 Final Results:', {
          priorArtCount: finalState.priorArt?.length || 0,
          hasNoveltyAnalysis: !!finalState.noveltyAnalysis,
          hasPatentDraft: !!finalState.patentDraft,
          claimsCount: finalState.claims?.length || 0,
          diagramsCount: finalState.diagrams?.length || 0,
          errors: finalState.errors?.length || 0
        });
        
        // Verify the final state has the expected data
        if (!finalState.priorArt || finalState.priorArt.length === 0) {
          console.warn('⚠️ Warning: Final state has no prior art results');
        }
        if (!finalState.noveltyAnalysis) {
          console.warn('⚠️ Warning: Final state has no novelty analysis');
        }
        if (!finalState.patentDraft) {
          console.warn('⚠️ Warning: Final state has no patent draft');
        }
        if (!finalState.claims || finalState.claims.length === 0) {
          console.warn('⚠️ Warning: Final state has no claims');
        }
        if (!finalState.diagrams || finalState.diagrams.length === 0) {
          console.warn('⚠️ Warning: Final state has no diagrams');
        }
        
        result = {
          success: true,
          data: finalState,
          message: 'Patent creation workflow completed successfully using direct agent execution'
        };
        
        // Cache the workflow result
        if (mode === 'cached') {
          const workflowCacheKey = cache.generateKey('workflow', abstract);
          cache.set(workflowCacheKey, finalState);
          console.log('💾 Result cached for future use');
        }
    }
    
    // Add metrics to result
    result.metrics = monitor.getMetrics();
    
    return result;
    
  } catch (error) {
    console.error('❌ Workflow Execution Error:', error);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      error: error.message,
      metrics: monitor.getMetrics(),
      message: 'Patent creation workflow failed'
    };
  }
}

// Export enhancement utilities for external use
export {
  cache,
  monitor,
  errorRecovery,
  parallelManager
};