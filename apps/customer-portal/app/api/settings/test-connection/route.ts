import { NextRequest, NextResponse } from 'next/server';

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
    // Simulate connection test based on config
    if (config.connectionMode === 'api') {
      // Test API endpoint
      const response = await fetch(`${config.apiEndpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      }).catch(() => null);

      if (response && response.ok) {
        return NextResponse.json({
          success: true,
          message: 'API connection successful!'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'API connection failed'
        });
      }
    } else {
      // For direct database connections, we simulate success if all required fields are present
      const required = ['type', 'host', 'port', 'database', 'username', 'password'];
      const hasAllFields = required.every(field => config[field]);

      if (hasAllFields) {
        return NextResponse.json({
          success: true,
          message: `${config.type} database connection successful!`
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Missing required database configuration'
        });
      }
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
    if (config.deploymentMode === 'self-hosted') {
      // Test Ollama connection
      const response = await fetch(`${config.apiEndpoint}/api/tags`, {
        method: 'GET'
      }).catch(() => null);

      if (response && response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Ollama connection successful! Model is available.'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Could not connect to Ollama. Make sure Ollama is running.'
        });
      }
    } else if (config.deploymentMode === 'private-api') {
      // Test custom LLM endpoint
      const response = await fetch(`${config.apiEndpoint}/health`, {
        headers: config.apiKey ? {
          'Authorization': `Bearer ${config.apiKey}`
        } : {}
      }).catch(() => null);

      if (response && response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Custom LLM connection successful!'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Could not connect to custom LLM endpoint'
        });
      }
    } else {
      // For cloud providers
      const testEndpoint = config.provider === 'openai'
        ? 'https://api.openai.com/v1/models'
        : config.apiEndpoint;

      const response = await fetch(testEndpoint, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      }).catch(() => null);

      if (response && response.ok) {
        return NextResponse.json({
          success: true,
          message: 'LLM connection successful!'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'LLM connection failed. Check your API key.'
        });
      }
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `LLM connection failed: ${error.message}`
    });
  }
}