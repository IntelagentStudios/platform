import { NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { website, useSkillsOrchestrator } = await request.json();
    if (!website) {
      return NextResponse.json({ error: 'Website URL required' }, { status: 400 });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build'
    });

    // Create a text encoder for streaming
    const encoder = new TextEncoder();

    // Create a stream to send progress updates
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the analysis in the background
    (async () => {
      try {
        if (useSkillsOrchestrator) {
          // Use AI for deep research with multiple phases

          // Send initial progress
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Initializing AI research agent...'
          })}\n\n`));

          // Phase 1: Website Analysis
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Reading your website to understand your business...'
          })}\n\n`));

          // Fetch website content
          let websiteContent = '';
          try {
            const response = await fetch(website, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Intelagent/1.0)' },
              signal: AbortSignal.timeout(10000)
            });
            if (response.ok) {
              const html = await response.text();
              websiteContent = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .substring(0, 8000);
            }
          } catch (error) {
            console.error('Failed to fetch website:', error);
          }

          // Phase 2: Company Information Research
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Learning about what you do and who you serve...'
          })}\n\n`));

          const companyResearchPrompt = `
            Analyze this website and extract comprehensive company information:
            URL: ${website}
            Website Content: ${websiteContent || 'Content not available'}

            Please extract and provide:
            1. Company name
            2. Industry/sector
            3. Company description (2-3 sentences)
            4. Target market/customer base
            5. Estimated company size
            6. Location/headquarters
            7. Key products/services
            8. Value proposition
            9. Common pain points their customers face
            10. Technologies they likely use
            11. Market positioning
            12. Recent news or updates (if mentioned)

            Format as JSON with these exact keys: companyName, industry, description, targetMarket, companySize, location, products, valueProposition, painPoints (array), technologies (array), marketPosition, recentNews (array)
          `;

          const companyAnalysis = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'You are an expert business analyst specializing in company research and market analysis. Extract detailed, accurate information from websites and provide comprehensive business intelligence.'
              },
              {
                role: 'user',
                content: companyResearchPrompt
              }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          });

          const companyData = JSON.parse(companyAnalysis.choices[0].message.content || '{}');

          // Phase 3: Industry Analysis
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Understanding your industry and customer needs...'
          })}\n\n`));

          const industryPrompt = `
            Based on this company profile:
            Company: ${companyData.companyName || 'Unknown'}
            Industry: ${companyData.industry || 'Technology'}
            Description: ${companyData.description || ''}

            Provide industry analysis:
            1. Current market trends in this industry
            2. Common challenges companies face
            3. Growth opportunities
            4. Competitive landscape insights
            5. Technology trends affecting this industry

            Format as JSON with keys: marketTrends (array), challenges (array), opportunities (array), competitiveLandscape, techTrends (array)
          `;

          const industryAnalysis = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'You are an industry analyst providing strategic insights about market dynamics and business trends.'
              },
              {
                role: 'user',
                content: industryPrompt
              }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          });

          const industryData = JSON.parse(industryAnalysis.choices[0].message.content || '{}');

          // Phase 4: Competitor Analysis
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Identifying who you compete with...'
          })}\n\n`));

          const competitorPrompt = `
            For a company in the ${companyData.industry || 'technology'} industry with this profile:
            ${companyData.description || ''}

            Identify:
            1. 3-5 likely competitors
            2. Competitive advantages this company might have
            3. Potential differentiators

            Format as JSON with keys: competitors (array of names), advantages (array), differentiators (array)
          `;

          const competitorAnalysis = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive intelligence analyst identifying market players and competitive dynamics.'
              },
              {
                role: 'user',
                content: competitorPrompt
              }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          });

          const competitorData = JSON.parse(competitorAnalysis.choices[0].message.content || '{}');

          // Compile comprehensive results
          const companyProfile = {
            companyName: companyData.companyName || new URL(website).hostname.replace('www.', '').split('.')[0],
            industry: companyData.industry || 'Technology',
            description: companyData.description || '',
            targetMarket: companyData.targetMarket || 'B2B companies',
            companySize: companyData.companySize || '50-200 employees',
            location: companyData.location || '',
            products: companyData.products || [],
            valueProposition: companyData.valueProposition || '',
            painPoints: [
              ...(companyData.painPoints || []),
              ...(industryData.challenges || [])
            ].slice(0, 5),
            technologies: companyData.technologies || [],
            marketPosition: companyData.marketPosition || industryData.competitiveLandscape || '',
            recentNews: companyData.recentNews || [],
            marketTrends: industryData.marketTrends || [],
            opportunities: industryData.opportunities || [],
            techTrends: industryData.techTrends || [],
            competitors: competitorData.competitors || [],
            advantages: competitorData.advantages || [],
            differentiators: competitorData.differentiators || []
          };

          // Send final result
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            data: companyProfile
          })}\n\n`));

        } else {
          // Simple analysis without deep research
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Getting basic company information...'
          })}\n\n`));

          const url = new URL(website);
          const companyName = url.hostname.replace('www.', '').split('.')[0];

          const simpleProfile = {
            companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
            industry: 'Technology',
            description: `${companyName} is a company focused on delivering innovative solutions.`,
            targetMarket: 'B2B companies',
            companySize: '50-200 employees',
            location: '',
            products: [],
            valueProposition: '',
            painPoints: [
              'Scaling operations efficiently',
              'Customer acquisition and retention',
              'Digital transformation'
            ],
            technologies: [],
            marketPosition: '',
            recentNews: [],
            marketTrends: [],
            opportunities: [],
            techTrends: [],
            competitors: [],
            advantages: [],
            differentiators: []
          };

          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            data: simpleProfile
          })}\n\n`));
        }
      } catch (error) {
        console.error('Analysis error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: 'Failed to analyze company'
        })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    // Return the streaming response
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error analyzing company:', error);
    return NextResponse.json(
      { error: 'Failed to analyze company' },
      { status: 500 }
    );
  }
}