import { NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { website } = await request.json();
    if (!website) {
      return NextResponse.json({ error: 'Website URL required' }, { status: 400 });
    }

    // Initialize OpenAI with fallback for build time
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build'
    });

    // Use WebFetch-like approach to analyze the website
    const prompt = `
      Analyze this website URL: ${website}
      
      Extract the following information:
      1. Company name
      2. Industry/sector they operate in

      Return the information in JSON format:
      {
        "companyName": "extracted company name",
        "industry": "their industry"
      }
      
      If you cannot access the website or extract certain information, use reasonable defaults based on the URL.
    `;

    try {
      // First try to fetch website content
      const websiteResponse = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Intelagent/1.0)'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      let websiteContent = '';
      if (websiteResponse.ok) {
        const html = await websiteResponse.text();
        // Extract text content from HTML (basic extraction)
        websiteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 5000); // Limit to first 5000 chars
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst helping to understand companies from their websites. Extract relevant business information and provide it in JSON format.'
          },
          {
            role: 'user',
            content: websiteContent
              ? `${prompt}\n\nWebsite content:\n${websiteContent}`
              : `${prompt}\n\nNote: Could not fetch website content, please infer from the URL: ${website}`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      // Ensure we have all fields with sensible defaults
      return NextResponse.json({
        companyName: result.companyName || new URL(website).hostname.replace('www.', '').split('.')[0],
        industry: result.industry || 'Technology'
      });
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      
      // Fallback to basic extraction from URL
      const url = new URL(website);
      const domainName = url.hostname.replace('www.', '').split('.')[0];
      
      return NextResponse.json({
        companyName: domainName.charAt(0).toUpperCase() + domainName.slice(1),
        industry: 'Technology'
      });
    }
  } catch (error) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    );
  }
}