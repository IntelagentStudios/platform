import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorAgent } from '@intelagent/skills-orchestrator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A/B Testing endpoint for comparing n8n vs skills performance
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { 
      message, 
      productKey, 
      sessionId,
      testMode = 'auto' // 'auto', 'skills', 'n8n', 'both'
    } = body;

    // Determine which system to use based on test mode
    let useSkills = true;
    let useN8n = false;
    
    if (testMode === 'auto') {
      // 50/50 split for A/B testing
      useSkills = Math.random() < 0.5;
      useN8n = !useSkills;
    } else if (testMode === 'both') {
      // Test both systems in parallel
      useSkills = true;
      useN8n = true;
    } else if (testMode === 'n8n') {
      useSkills = false;
      useN8n = true;
    }

    const results = {
      testId: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      message,
      productKey,
      sessionId,
      testMode,
      results: {} as any
    };

    // Test Skills System
    if (useSkills) {
      const skillsStart = performance.now();
      try {
        const skillsResponse = await testSkillsSystem(message, productKey, sessionId);
        const skillsEnd = performance.now();
        
        results.results.skills = {
          success: true,
          responseTime: Math.round(skillsEnd - skillsStart),
          response: skillsResponse.response,
          characterCount: skillsResponse.response?.length || 0,
          error: null
        };
      } catch (error) {
        results.results.skills = {
          success: false,
          responseTime: Math.round(performance.now() - skillsStart),
          response: null,
          error: error.message
        };
      }
    }

    // Test n8n System
    if (useN8n) {
      const n8nStart = performance.now();
      try {
        const n8nResponse = await testN8nSystem(message, productKey, sessionId);
        const n8nEnd = performance.now();
        
        results.results.n8n = {
          success: true,
          responseTime: Math.round(n8nEnd - n8nStart),
          response: n8nResponse.response,
          characterCount: n8nResponse.response?.length || 0,
          error: null
        };
      } catch (error) {
        results.results.n8n = {
          success: false,
          responseTime: Math.round(performance.now() - n8nStart),
          response: null,
          error: error.message
        };
      }
    }

    // Calculate comparison metrics
    if (results.results.skills && results.results.n8n) {
      const skillsTime = results.results.skills.responseTime;
      const n8nTime = results.results.n8n.responseTime;
      
      results['comparison'] = {
        winner: skillsTime < n8nTime ? 'skills' : 'n8n',
        skillsTime,
        n8nTime,
        improvement: Math.round(((n8nTime - skillsTime) / n8nTime) * 100),
        skillsFaster: skillsTime < n8nTime,
        timeDifference: Math.abs(skillsTime - n8nTime)
      };
    }

    // Store test results in database
    await storeTestResults(results);

    // Return the actual response from the selected system
    const selectedSystem = useSkills ? 'skills' : 'n8n';
    const selectedResponse = results.results[selectedSystem];
    
    return NextResponse.json({
      response: selectedResponse?.response || 'No response generated',
      metadata: {
        system: selectedSystem,
        responseTime: selectedResponse?.responseTime,
        testId: results.testId,
        comparison: results['comparison']
      }
    }, {
      headers: {
        'X-Test-System': selectedSystem,
        'X-Response-Time': String(selectedResponse?.responseTime || 0),
        'X-Test-Id': results.testId,
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('A/B test error:', error);
    return NextResponse.json({
      error: 'A/B test failed',
      message: error.message
    }, { status: 500 });
  }
}

async function testSkillsSystem(message: string, productKey: string, sessionId: string) {
  // Call the skills API endpoint
  const response = await fetch('https://dashboard.intelagentstudios.com/api/chatbot-skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, productKey, sessionId })
  });

  if (!response.ok) {
    throw new Error(`Skills API error: ${response.status}`);
  }

  return response.json();
}

async function testN8nSystem(message: string, productKey: string, sessionId: string) {
  // Call the n8n webhook
  const response = await fetch('https://1ntelagent.up.railway.app/webhook/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message, 
      productKey, 
      sessionId,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`n8n webhook error: ${response.status}`);
  }

  return response.json();
}

async function storeTestResults(results: any) {
  try {
    // Store in chatbot_logs table with A/B test info in intent_detected
    const abTestInfo = JSON.stringify({
      abTest: true,
      testId: results.testId,
      testMode: results.testMode,
      responseTime: results.results.skills?.responseTime || results.results.n8n?.responseTime,
      winner: results.comparison?.winner
    });
    
    await prisma.chatbot_logs.create({
      data: {
        product_key: results.productKey,
        session_id: results.sessionId,
        customer_message: results.message,
        chatbot_response: results.results.skills?.response || results.results.n8n?.response || '',
        conversation_id: results.sessionId,
        intent_detected: abTestInfo.slice(0, 255), // Store A/B test info in intent field (max 255 chars)
        domain: 'intelagentstudios.com',
        user_id: 'ab_test_user',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to store A/B test results:', error);
    // Don't fail the request if storage fails
  }
}

// GET endpoint for A/B test results analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';
    const detailed = searchParams.get('detailed') === 'true';

    // Calculate time range
    let since = new Date();
    switch(period) {
      case '1h':
        since.setHours(since.getHours() - 1);
        break;
      case '24h':
        since.setHours(since.getHours() - 24);
        break;
      case '7d':
        since.setDate(since.getDate() - 7);
        break;
    }

    // Get A/B test results from chatbot_logs table
    const testResults = await prisma.chatbot_logs.findMany({
      where: {
        timestamp: { gte: since },
        intent_detected: {
          contains: '"abTest":true'
        }
      },
      orderBy: { timestamp: 'desc' },
      take: detailed ? 1000 : 100
    });

    // Analyze results
    const analysis = {
      period,
      totalTests: testResults.length,
      timestamp: new Date().toISOString(),
      systems: {
        skills: {
          tests: 0,
          successes: 0,
          failures: 0,
          avgResponseTime: 0,
          p50ResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0
        },
        n8n: {
          tests: 0,
          successes: 0,
          failures: 0,
          avgResponseTime: 0,
          p50ResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0
        }
      },
      comparison: {
        skillsWins: 0,
        n8nWins: 0,
        avgImprovement: 0,
        medianImprovement: 0
      }
    };

    // Process test results
    const skillsTimes: number[] = [];
    const n8nTimes: number[] = [];
    const improvements: number[] = [];

    testResults.forEach(result => {
      // Parse A/B test info from intent_detected field
      let meta: any = {};
      try {
        if (result.intent_detected) {
          meta = JSON.parse(result.intent_detected);
        }
      } catch (e) {
        // Skip invalid JSON
        return;
      }
      
      // For now, just count tests since we don't have the full results structure
      if (meta?.abTest) {
        analysis.systems.skills.tests++;
        analysis.systems.skills.successes++;
        
        if (meta.responseTime) {
          skillsTimes.push(meta.responseTime);
        }
        
        if (meta.winner === 'skills') {
          analysis.comparison.skillsWins++;
        } else if (meta.winner === 'n8n') {
          analysis.comparison.n8nWins++;
        }
      }
    });

    // Calculate statistics
    if (skillsTimes.length > 0) {
      analysis.systems.skills.avgResponseTime = Math.round(
        skillsTimes.reduce((a, b) => a + b, 0) / skillsTimes.length
      );
      skillsTimes.sort((a, b) => a - b);
      analysis.systems.skills.p50ResponseTime = percentile(skillsTimes, 50);
      analysis.systems.skills.p95ResponseTime = percentile(skillsTimes, 95);
      analysis.systems.skills.p99ResponseTime = percentile(skillsTimes, 99);
    }

    if (n8nTimes.length > 0) {
      analysis.systems.n8n.avgResponseTime = Math.round(
        n8nTimes.reduce((a, b) => a + b, 0) / n8nTimes.length
      );
      n8nTimes.sort((a, b) => a - b);
      analysis.systems.n8n.p50ResponseTime = percentile(n8nTimes, 50);
      analysis.systems.n8n.p95ResponseTime = percentile(n8nTimes, 95);
      analysis.systems.n8n.p99ResponseTime = percentile(n8nTimes, 99);
    }

    if (improvements.length > 0) {
      analysis.comparison.avgImprovement = Math.round(
        improvements.reduce((a, b) => a + b, 0) / improvements.length
      );
      improvements.sort((a, b) => a - b);
      analysis.comparison.medianImprovement = percentile(improvements, 50);
    }

    // Add detailed results if requested
    if (detailed) {
      analysis['recentTests'] = testResults.slice(0, 10).map(r => {
        let meta: any = {};
        try {
          if (r.intent_detected) {
            meta = JSON.parse(r.intent_detected);
          }
        } catch (e) {
          // Skip invalid JSON
        }
        
        return {
          testId: meta?.testId,
          timestamp: r.timestamp,
          message: r.customer_message,
          responseTime: meta?.responseTime,
          winner: meta?.winner
        };
      });
    }

    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Failed to analyze A/B test results:', error);
    return NextResponse.json({
      error: 'Analysis failed',
      message: error.message
    }, { status: 500 });
  }
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[Math.max(0, index)];
}