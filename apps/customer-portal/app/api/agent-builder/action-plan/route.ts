import { NextRequest, NextResponse } from 'next/server';

// Handle structured action plans from n8n workflow
export async function POST(request: NextRequest) {
  try {
    // Check for API key in header (supports both Bearer token and x-api-key)
    const authHeader = request.headers.get('authorization');
    const xApiKey = request.headers.get('x-api-key');

    let apiKey = xApiKey;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }

    const expectedKey = process.env.N8N_API_KEY || 'intelagent-n8n-2024';

    // Only enforce if N8N_API_KEY is set in environment
    if (process.env.N8N_API_KEY && apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();

    console.log('Action Plan received:', {
      sessionId: body.sessionId,
      actions: body.actions?.length,
      proposals: body.proposals,
      pricing: body.pricing,
      idempotencyKey: body.idempotencyKey,
      dry_run: body.dry_run
    });

    const {
      sessionId,
      context = {},
      proposals = {},
      pricing = {},
      actions = [],
      idempotencyKey,
      dry_run = false
    } = body;

    // Process results
    const results = {
      sessionId,
      processed: [],
      errors: [],
      configuration: {
        skills: [],
        integrations: [],
        features: []
      },
      pricing: pricing,
      preview: null,
      version: null
    };

    // Build the new configuration based on context and proposals
    const currentSkills = new Set(context.skills || []);
    const currentIntegrations = new Set(context.integrations || []);
    const currentFeatures = new Set(context.features || []);

    // Apply proposals
    const proposedSkills = new Set(proposals.skills || []);
    const proposedIntegrations = new Set(proposals.integrations || []);
    const proposedFeatures = new Set(proposals.features || []);

    // Process each action
    for (const action of actions) {
      try {
        console.log('Processing action:', action);

        switch (action.type) {
          case 'add_skill':
            if (action.payload?.skills) {
              const skillsToAdd = Array.isArray(action.payload.skills)
                ? action.payload.skills
                : [action.payload.skills];

              skillsToAdd.forEach(skill => {
                currentSkills.add(skill);
                proposedSkills.add(skill);
              });

              results.processed.push({
                type: 'add_skill',
                status: 'success',
                skills: skillsToAdd
              });
            }
            break;

          case 'remove_skill':
            if (action.payload?.skills) {
              const skillsToRemove = Array.isArray(action.payload.skills)
                ? action.payload.skills
                : [action.payload.skills];

              skillsToRemove.forEach(skill => {
                currentSkills.delete(skill);
                proposedSkills.delete(skill);
              });

              results.processed.push({
                type: 'remove_skill',
                status: 'success',
                skills: skillsToRemove
              });
            }
            break;

          case 'set_features':
            if (action.payload?.features) {
              currentFeatures.clear();
              action.payload.features.forEach((f: string) => {
                currentFeatures.add(f);
                proposedFeatures.add(f);
              });

              results.processed.push({
                type: 'set_features',
                status: 'success',
                features: action.payload.features
              });
            }
            break;

          case 'set_integrations':
            if (action.payload?.integrations) {
              currentIntegrations.clear();
              action.payload.integrations.forEach((i: string) => {
                currentIntegrations.add(i);
                proposedIntegrations.add(i);
              });

              results.processed.push({
                type: 'set_integrations',
                status: 'success',
                integrations: action.payload.integrations
              });
            }
            break;

          case 'trigger_preview':
            if (!dry_run) {
              // In production, this would trigger the preview update
              results.preview = {
                status: 'triggered',
                mode: action.payload?.mode || 'auto',
                timestamp: new Date().toISOString()
              };

              results.processed.push({
                type: 'trigger_preview',
                status: 'success'
              });
            }
            break;

          case 'save_version':
            if (!dry_run) {
              // In production, this would save a version
              results.version = {
                status: 'saved',
                reason: action.payload?.reason || 'manual',
                timestamp: new Date().toISOString()
              };

              results.processed.push({
                type: 'save_version',
                status: 'success'
              });
            }
            break;

          default:
            console.warn('Unknown action type:', action.type);
            results.errors.push({
              action: action.type,
              error: 'Unknown action type'
            });
        }
      } catch (actionError: any) {
        console.error('Error processing action:', action, actionError);
        results.errors.push({
          action: action.type,
          error: actionError.message
        });
      }
    }

    // Combine current and proposed into final configuration
    results.configuration = {
      skills: Array.from(new Set([...currentSkills, ...proposedSkills])),
      integrations: Array.from(new Set([...currentIntegrations, ...proposedIntegrations])),
      features: Array.from(new Set([...currentFeatures, ...proposedFeatures]))
    };

    // Add metadata
    const response = {
      success: results.errors.length === 0,
      sessionId: sessionId || 'anonymous',
      idempotencyKey,
      timestamp: new Date().toISOString(),
      results,
      // Echo back the pricing from n8n
      pricing: pricing,
      // Configuration update for the frontend
      configUpdate: {
        action: 'set_skills', // or 'add_skills' based on context
        skills: results.configuration.skills,
        integrations: results.configuration.integrations,
        features: results.configuration.features,
        pricing: pricing
      }
    };

    console.log('Action Plan response:', {
      success: response.success,
      processed: results.processed.length,
      errors: results.errors.length,
      skills: results.configuration.skills.length,
      integrations: results.configuration.integrations.length,
      features: results.configuration.features.length
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Action Plan API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process action plan',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  });
}