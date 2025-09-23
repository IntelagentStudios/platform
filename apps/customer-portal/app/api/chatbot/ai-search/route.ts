import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { query, conversations } = await request.json();

    if (!query || !conversations) {
      return NextResponse.json({ error: 'Missing query or conversations' }, { status: 400 });
    }

    // If no OpenAI key, fall back to basic search
    if (!process.env.OPENAI_API_KEY) {
      // Simple fallback: return all conversations that contain the query
      const matchedIds = conversations
        .filter((conv: any) => {
          const content = JSON.stringify(conv.messages).toLowerCase();
          return content.includes(query.toLowerCase());
        })
        .map((conv: any) => conv.id);

      return NextResponse.json({ matchedIds });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Prepare conversations for AI analysis
    const conversationSummaries = conversations.map((conv: any) => ({
      id: conv.id,
      content: conv.messages.map((m: any) => `${m.sender}: ${m.content}`).join(' '),
      domain: conv.domain,
      date: conv.first_message_at
    }));

    const prompt = `You are an AI search assistant. Search through these chatbot conversations and find the ones most relevant to this query: "${query}"

Consider:
- Semantic meaning, not just exact word matches
- Context and intent of the conversation
- Related topics and concepts
- User problems and solutions discussed

Conversations:
${JSON.stringify(conversationSummaries, null, 2)}

Return a JSON object with:
{
  "matchedIds": [array of conversation IDs that match the query, ordered by relevance]
}

Only include conversations that are genuinely relevant to the search query.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a search assistant that finds relevant conversations based on semantic meaning and context.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      matchedIds: result.matchedIds || []
    });

  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}