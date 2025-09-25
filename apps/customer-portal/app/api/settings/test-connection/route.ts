import { NextRequest, NextResponse } from 'next/server';
import { PostgresAdapter } from '@/packages/database/src/adapters/PostgresAdapter';
import { ApiAdapter } from '@/packages/database/src/adapters/ApiAdapter';
import { OllamaProvider } from '@/packages/ai-intelligence/src/providers/OllamaProvider';
import { CustomLLMProvider } from '@/packages/ai-intelligence/src/providers/CustomLLMProvider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, config } = body;

    if (type === 'database') {
      return testDatabaseConnection(config);
    } else if (type === 'llm') {
      return testLLMConnection(config);
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid connection type' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Test failed' },
      { status: 500 }
    );
  }
}

async function testDatabaseConnection(config: any) {
  try {
    let adapter;

    if (config.connectionMode === 'api') {
      adapter = new ApiAdapter({
        type: 'api',
        apiEndpoint: config.apiEndpoint,
        apiKey: config.apiKey
      });
    } else {
      adapter = new PostgresAdapter({
        type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        ssl: config.ssl
      });
    }

    await adapter.connect();
    const healthy = await adapter.healthCheck();
    await adapter.disconnect();

    if (healthy) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database health check failed'
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Connection failed: ${error.message}`
    });
  }
}

async function testLLMConnection(config: any) {
  try {
    let provider;

    if (config.deploymentMode === 'self-hosted') {
      provider = new OllamaProvider({
        provider: 'ollama',
        apiEndpoint: config.apiEndpoint,
        model: config.model
      });
    } else if (config.deploymentMode === 'private-api') {
      provider = new CustomLLMProvider({
        provider: 'custom',
        apiEndpoint: config.apiEndpoint,
        apiKey: config.apiKey,
        model: config.model
      });
    } else {
      // For cloud providers, we'd use the appropriate provider
      // For now, just test with a simple fetch
      const testEndpoint = config.provider === 'openai' 
        ? 'https://api.openai.com/v1/models'
        : config.apiEndpoint;

      const response = await fetch(testEndpoint, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'LLM connection successful!'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'LLM connection failed'
        });
      }
    }

    const healthy = await provider.healthCheck();

    if (healthy) {
      // Try a simple completion to verify it works
      const response = await provider.complete([
        { role: 'user', content: 'Say "test successful"' }
      ]);

      return NextResponse.json({
        success: true,
        message: 'LLM connection successful! Model is responding.'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'LLM health check failed'
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `LLM connection failed: ${error.message}`
    });
  }
}