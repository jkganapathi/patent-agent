// 📁 app/page.js
'use client'

import React, { useState } from 'react';
import { Search, FileText, Lightbulb, CheckCircle, Clock, Download, RefreshCw, AlertCircle, CheckCircle2, Zap, Palette, Scale, Settings, BarChart3, Database, Cpu } from 'lucide-react';

export default function PatentCreatorApp() {
  const [abstract, setAbstract] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState({
    priorArt: [],
    noveltyAnalysis: '',
    patentDraft: '',
    claims: [],
    diagrams: [],
    errors: []
  });
  
  // Enhancement features state
  const [executionMode, setExecutionMode] = useState('standard');
  const [useCache, setUseCache] = useState(true);
  const [enableParallel, setEnableParallel] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const steps = [
    { id: 0, name: 'Submit Abstract', icon: FileText, status: 'active' },
    { id: 1, name: 'Search Agent', icon: Search, status: 'pending' },
    { id: 2, name: 'Research Agent', icon: Lightbulb, status: 'pending' },
    { id: 3, name: 'Claims Agent', icon: Scale, status: 'pending' },
    { id: 4, name: 'Document Agent', icon: FileText, status: 'pending' },
    { id: 5, name: 'Diagram Agent', icon: Palette, status: 'pending' }
  ];

  const callPatentAPI = async (abstract, options = {}) => {
    try {
      const response = await fetch('/api/patent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          abstract,
          mode: options.mode || executionMode,
          useCache: options.useCache !== undefined ? options.useCache : useCache,
          enableParallel: options.enableParallel !== undefined ? options.enableParallel : enableParallel
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  const simulateAgentWorkflow = async () => {
    setIsProcessing(true);
    setError('');
    setMetrics(null);
    setIsCached(false);

    try {
      console.log('🚀 Starting Enhanced Multi-Agent Workflow...');
      console.log('Execution Mode:', executionMode);
      console.log('Use Cache:', useCache);
      console.log('Enable Parallel:', enableParallel);
      
      // Execute the enhanced workflow
      const workflowData = await callPatentAPI(abstract, {
        mode: executionMode,
        useCache: useCache,
        enableParallel: enableParallel
      });
      
      // Update results with all workflow data
      setResults({
        priorArt: workflowData.priorArt || [],
        noveltyAnalysis: workflowData.noveltyAnalysis || '',
        patentDraft: workflowData.patentDraft || '',
        claims: workflowData.claims || [],
        diagrams: workflowData.diagrams || [],
        errors: workflowData.errors || []
      });
      
      // Store metrics and cache status
      setMetrics(workflowData.metrics);
      setIsCached(workflowData.cached || false);
      
      // Simulate step-by-step progress for UI
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(5);
      
      console.log('✅ Enhanced Multi-Agent Workflow Completed Successfully!');
      console.log('Results:', {
        priorArt: workflowData.priorArt?.length || 0,
        claims: workflowData.claims?.length || 0,
        diagrams: workflowData.diagrams?.length || 0,
        errors: workflowData.errors?.length || 0,
        cached: workflowData.cached,
        mode: workflowData.mode
      });
      
    } catch (error) {
      console.error('Workflow error:', error);
      setError(error.message || 'An error occurred during patent creation');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPatent = () => {
    if (!results.patentDraft) return;
    
    const element = document.createElement('a');
    const file = new Blob([results.patentDraft], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `patent_draft_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadClaims = () => {
    if (!results.claims || results.claims.length === 0) return;
    
    const claimsText = results.claims.map(claim => 
      `Claim ${claim.claim_number} (${claim.claim_type}):\n${claim.claim_text}\n\n`
    ).join('');
    
    const element = document.createElement('a');
    const file = new Blob([claimsText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `patent_claims_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = () => {
    if (abstract.trim()) {
      simulateAgentWorkflow();
    }
  };

  const resetProcess = () => {
    setCurrentStep(0);
    setIsProcessing(false);
    setError('');
    setResults({
      priorArt: [],
      noveltyAnalysis: '',
      patentDraft: '',
      claims: [],
      diagrams: [],
      errors: []
    });
    setAbstract('');
    setMetrics(null);
    setIsCached(false);
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/patent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      
      if (response.ok) {
        console.log('✅ Cache cleared successfully');
      }
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  };

  const getMetrics = async () => {
    try {
      const response = await fetch('/api/patent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_metrics' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        console.log('📊 Metrics retrieved:', data.metrics);
      }
    } catch (error) {
      console.error('❌ Failed to get metrics:', error);
    }
  };

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep && isProcessing) return 'active';
    if (stepId === currentStep && !isProcessing) return 'completed';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Enhanced Patent Creator AI Agent</h1>
          <p className="text-gray-600">Powered by LangGraph Multi-Agent System • Claude Sonnet 4 • Vercel AI Gateway</p>
          <div className="mt-4 p-4 bg-blue-500 text-white rounded-lg">
            <p>Advanced AI-Powered Patent Creation System - Multi-Agent Workflow with Future Enhancements</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 fade-in">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'active' ? 'bg-green-500 text-white pulse' :
                    'bg-gray-300 text-gray-500'
                  }`}>
                    {status === 'active' && isProcessing ? 
                      <Clock className="w-5 h-5 spin" /> : 
                      status === 'completed' ?
                      <CheckCircle2 className="w-5 h-5" /> :
                      <Icon className="w-5 h-5" />
                    }
                  </div>
                  <span className={`text-sm font-medium text-center ${
                    status === 'completed' ? 'text-green-600' :
                    status === 'active' ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
            
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300 -z-10">
              <div 
                className="h-full bg-green-500 transition-all duration-500 progress-animate"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Submit Your Abstract</h2>
              {results.patentDraft && (
                <button
                  onClick={resetProcess}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
            
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Enter your invention abstract here. Be specific about the problem you're solving, your unique approach, and the technical implementation. For example:

'A novel AI-powered system that personalizes content in real-time by analyzing user behavior patterns and adapting recommendations using machine learning algorithms. The system integrates multiple data sources and employs dynamic learning mechanisms to continuously improve personalization accuracy...'"
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            
            {/* Advanced Options */}
            <div className="mt-4">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Settings className="w-4 h-4" />
                Advanced Options
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Execution Mode
                    </label>
                    <select
                      value={executionMode}
                      onChange={(e) => setExecutionMode(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="standard">Standard (Sequential)</option>
                      <option value="parallel">Parallel (Independent Agents)</option>
                      <option value="robust">Robust (With Retry)</option>
                      <option value="cached">Cached (Use Cache)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={useCache}
                        onChange={(e) => setUseCache(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Enable Caching</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enableParallel}
                        onChange={(e) => setEnableParallel(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Enable Parallel Processing</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={clearCache}
                      className="flex items-center gap-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm"
                    >
                      <Database className="w-4 h-4" />
                      Clear Cache
                    </button>
                    
                    <button
                      onClick={getMetrics}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Get Metrics
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={!abstract.trim() || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 spin" />
                    Enhanced Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Start Enhanced Workflow
                  </>
                )}
              </button>
            </div>

            {/* Character Counter */}
            <div className="mt-2 text-right text-sm text-gray-500">
              {abstract.length} characters
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            {metrics && (
              <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <Cpu className="w-5 h-5 mr-2 text-purple-500" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="font-medium text-purple-800">Total Execution Time</p>
                    <p className="text-purple-600">{metrics.totalExecutionTime}ms</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium text-green-800">Successful Executions</p>
                    <p className="text-green-600">{metrics.successfulExecutions}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="font-medium text-red-800">Failed Executions</p>
                    <p className="text-red-600">{metrics.failedExecutions}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800">Average Response Time</p>
                    <p className="text-blue-600">{Math.round(metrics.averageResponseTime)}ms</p>
                  </div>
                </div>
                {isCached && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">✅ Result served from cache</p>
                  </div>
                )}
              </div>
            )}

            {/* Prior Art Analysis */}
            {results.priorArt.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <Search className="w-5 h-5 mr-2 text-blue-500" />
                  Search Agent Results
                </h3>
                <div className="space-y-3">
                  {results.priorArt.map((art, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800 flex-1 mr-2">{art.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          art.relevance === 'High' ? 'bg-red-100 text-red-800' :
                          art.relevance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {art.relevance}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{art.patent} • {art.date}</p>
                      <p className="text-sm text-gray-700">{art.summary}</p>
                      {art.similarity_score && (
                        <p className="text-xs text-gray-500 mt-1">Similarity: {art.similarity_score}%</p>
                      )}
                      {art.source && (
                        <p className="text-xs text-gray-500">Source: {art.source}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Novelty Analysis */}
            {results.noveltyAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Research Agent Analysis
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-green-800 whitespace-pre-wrap text-sm">
                      {results.noveltyAnalysis}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Claims Section */}
        {results.claims.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 fade-in">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
              <Scale className="w-6 h-6 mr-2 text-purple-500" />
              Claims Agent Results
            </h3>
            <div className="space-y-4">
              {results.claims.map((claim, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800">Claim {claim.claim_number}</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        claim.claim_type === 'Independent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {claim.claim_type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        claim.scope === 'Broad' ? 'bg-red-100 text-red-800' :
                        claim.scope === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {claim.scope}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{claim.claim_text}</p>
                  {claim.key_elements && claim.key_elements.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {claim.key_elements.map((element, elemIndex) => (
                        <span key={elemIndex} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {element}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button 
                onClick={downloadClaims}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Claims
              </button>
            </div>
          </div>
        )}

        {/* Diagrams Section */}
        {results.diagrams.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 fade-in">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
              <Palette className="w-6 h-6 mr-2 text-pink-500" />
              Diagram Agent Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.diagrams.map((diagram, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800">{diagram.title}</h4>
                    <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-medium">
                      {diagram.type}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{diagram.description}</p>
                  <p className="text-gray-600 text-xs mb-2"><strong>Purpose:</strong> {diagram.purpose}</p>
                  {diagram.key_elements && diagram.key_elements.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {diagram.key_elements.map((element, elemIndex) => (
                        <span key={elemIndex} className="px-2 py-1 bg-pink-100 text-pink-600 rounded text-xs">
                          {element}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patent Draft */}
        {results.patentDraft && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 fade-in">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-green-500" />
              Document Agent Results
            </h3>
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border patent-document">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {results.patentDraft}
              </pre>
            </div>
            <div className="mt-4 flex gap-4">
              <button 
                onClick={downloadPatent}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Patent Draft
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Refine Patent
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Export to USPTO Format
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Architecture Info */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 fade-in">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Enhanced Multi-Agent Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800">Search Agent</h4>
              <p className="text-sm text-blue-600 mt-1">Prior Art Discovery</p>
              <p className="text-xs text-blue-500 mt-1">Patent Research</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800">Research Agent</h4>
              <p className="text-sm text-yellow-600 mt-1">Novelty Analysis</p>
              <p className="text-xs text-yellow-500 mt-1">Patentability</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800">Claims Agent</h4>
              <p className="text-sm text-purple-600 mt-1">Claim Drafting</p>
              <p className="text-xs text-purple-500 mt-1">Legal Structure</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800">Document Agent</h4>
              <p className="text-sm text-green-600 mt-1">Patent Application</p>
              <p className="text-xs text-green-500 mt-1">USPTO Format</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
              <h4 className="font-semibold text-pink-800">Diagram Agent</h4>
              <p className="text-sm text-pink-600 mt-1">Technical Diagrams</p>
              <p className="text-xs text-pink-500 mt-1">Visual Elements</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-800">LangGraph</h4>
              <p className="text-sm text-indigo-600 mt-1">Workflow Orchestration</p>
              <p className="text-xs text-indigo-500 mt-1">Multi-Agent Coordination</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800">Cache System</h4>
              <p className="text-sm text-orange-600 mt-1">Performance Optimization</p>
              <p className="text-xs text-orange-500 mt-1">Result Caching</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
              <h4 className="font-semibold text-teal-800">Parallel Exec</h4>
              <p className="text-sm text-teal-600 mt-1">Concurrent Processing</p>
              <p className="text-xs text-teal-500 mt-1">Speed Optimization</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Enhanced Patent Creator AI Agent • Built with LangGraph Multi-Agent System, Claude Sonnet 4, and Vercel AI Gateway</p>
          <p className="mt-1">Advanced AI-powered patent analysis and generation using specialized agents with future enhancements</p>
        </div>
      </div>
    </div>
  );
}