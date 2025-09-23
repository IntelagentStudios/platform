import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { domain, email, productKey } = await request.json();

    // Default sophisticated colors: light, dark, accent
    const defaultColors = [
      '#F7F9FB', // Light option - soft, clean white
      '#1A202C', // Dark option - deep, professional dark
      '#5B7C99'  // Accent option - muted, sophisticated blue-gray
    ];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ colors: defaultColors });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Extract domain from email if not provided
    const websiteDomain = domain || (email ? email.split('@')[1] : '');

    const prompt = `Analyze the website ${websiteDomain} and suggest 3 colors for a chatbot widget that would look professional and match their brand.

Requirements:
1. First color: A LIGHT option for users who prefer light themes (should be light but not pure white)
2. Second color: A DARK option for users who prefer dark themes (should be dark but not pure black)
3. Third color: An ACCENT color that works well with both and matches the brand

The colors should:
- Be sophisticated and professional
- Work well for a chatbot interface
- Match the website's brand if possible
- Be accessible and easy to read

Return a JSON object with:
{
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"]
}

If you cannot determine the website's colors, provide professional defaults that work universally.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional UI/UX designer who specializes in color selection for web interfaces. Provide sophisticated, accessible color choices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      if (result.colors && result.colors.length === 3) {
        return NextResponse.json({ colors: result.colors });
      }
    } catch (aiError) {
      console.error('AI color analysis failed:', aiError);
    }

    // Return defaults if AI fails
    return NextResponse.json({ colors: defaultColors });

  } catch (error) {
    console.error('Color analysis error:', error);
    return NextResponse.json({
      colors: [
        '#F7F9FB', // Light
        '#1A202C', // Dark
        '#5B7C99'  // Accent
      ]
    });
  }
}