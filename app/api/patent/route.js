// 📁 app/api/patent/route.js
import { NextResponse } from 'next/server';
import { executePatentWorkflow, cache, monitor, errorRecovery, parallelManager } from '../../../lib/langgraph-config.js';

export async function POST(request) {
  try {
    // Check if at least one API key is configured
    const hasOpenAI = !!(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY);
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;
    
    if (!hasOpenAI && !hasGemini && !hasGroq) {
      console.error('No AI API keys configured');
      return NextResponse.json(
        { 
          error: 'No AI API keys configured. Please set at least one of: OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in your environment variables.' 
        },
        { status: 500 }
      );
    }
    
    console.log('Available AI providers:', {
      openai: hasOpenAI,
      gemini: hasGemini,
      groq: hasGroq
    });

    const { abstract, mode = 'standard', useCache = true, enableParallel = false } = await request.json();
    
    if (!abstract || !abstract.trim()) {
      return NextResponse.json(
        { error: 'Abstract is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting Enhanced Patent Creation Process...');
    console.log('Abstract:', abstract.substring(0, 100) + '...');
    console.log('Execution Mode:', mode);
    console.log('Use Cache:', useCache);
    console.log('Enable Parallel:', enableParallel);

    // Check cache first if enabled
    if (useCache) {
      const cacheKey = cache.generateKey('workflow', abstract);
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        console.log('✅ Using cached result');
        return NextResponse.json({
          success: true,
          priorArt: cachedResult.priorArt || [],
          noveltyAnalysis: cachedResult.noveltyAnalysis || '',
          patentDraft: cachedResult.patentDraft || '',
          claims: cachedResult.claims || [],
          diagrams: cachedResult.diagrams || [],
          errors: cachedResult.errors || [],
          message: 'Patent creation completed using cached result',
          cached: true,
          metrics: monitor.getMetrics()
        });
      }
    }

    // Determine execution mode
    let executionMode = mode;
    if (enableParallel && mode === 'standard') {
      executionMode = 'parallel';
    }

    // Execute the enhanced workflow
    const result = await executePatentWorkflow(abstract, executionMode);
    
    if (!result.success) {
      console.error('Workflow failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Patent creation workflow failed',
          details: result.error,
          metrics: result.metrics
        },
        { status: 500 }
      );
    }

    // Extract results from the workflow
    const workflowData = result.data;
    
    console.log('✅ Enhanced workflow completed successfully');
    console.log('Results:', {
      priorArtCount: workflowData.priorArt?.length || 0,
      hasNoveltyAnalysis: !!workflowData.noveltyAnalysis,
      hasPatentDraft: !!workflowData.patentDraft,
      hasClaims: workflowData.claims?.length || 0,
      hasDiagrams: workflowData.diagrams?.length || 0,
      errors: workflowData.errors?.length || 0
    });

    // Cache the result if caching is enabled
    if (useCache) {
      const cacheKey = cache.generateKey('workflow', abstract);
      cache.set(cacheKey, workflowData);
      console.log('💾 Result cached for future use');
    }

    return NextResponse.json({
      success: true,
      priorArt: workflowData.priorArt || [],
      noveltyAnalysis: workflowData.noveltyAnalysis || '',
      patentDraft: workflowData.patentDraft || '',
      claims: workflowData.claims || [],
      diagrams: workflowData.diagrams || [],
      errors: workflowData.errors || [],
      message: `Enhanced patent creation completed using ${executionMode} mode`,
      mode: executionMode,
      cached: false,
      metrics: result.metrics || monitor.getMetrics()
    });

  } catch (error) {
    console.error('❌ Enhanced Patent API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process patent request',
        details: error.message,
        metrics: monitor.getMetrics()
      },
      { status: 500 }
    );
  }
}

// New endpoint for cache management
export async function DELETE(request) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'clear_cache':
        cache.clear();
        console.log('🗑️ Cache cleared');
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });
        
      case 'get_metrics':
        return NextResponse.json({
          success: true,
          metrics: monitor.getMetrics(),
          cacheSize: cache.cache.size
        });
        
      case 'reset_metrics':
        monitor.reset();
        console.log('📊 Metrics reset');
        return NextResponse.json({
          success: true,
          message: 'Metrics reset successfully'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clear_cache, get_metrics, or reset_metrics' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Cache Management Error:', error);
    return NextResponse.json(
      { error: 'Cache management failed', details: error.message },
      { status: 500 }
    );
  }
}