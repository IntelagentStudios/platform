import { NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, targetLanguage, preserveFormatting } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build'
    });

    // Language code to full name mapping
    const languageNames: Record<string, string> = {
      'en': 'English',
      'en-US': 'American English',
      'en-GB': 'British English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'pt-BR': 'Brazilian Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'zh': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    // Special handling for UK/US English variations
    if (targetLanguage === 'en-GB' || targetLanguage === 'en-UK') {
      const prompt = `Convert the following American English text to British English, adjusting spelling (e.g., analyze → analyse, color → colour, center → centre), vocabulary (e.g., elevator → lift, apartment → flat), and date formats (MM/DD/YYYY → DD/MM/YYYY) as appropriate:

"${text}"

Return only the converted text without any explanation.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in English language variations. Convert text between American and British English accurately while preserving tone and meaning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return NextResponse.json({
        translatedText: completion.choices[0].message.content || text,
        targetLanguage,
        confidence: 0.95
      });
    }

    // Special handling for US English from UK English
    if (targetLanguage === 'en-US' && text.match(/colour|analyse|centre|behaviour/i)) {
      const prompt = `Convert the following British English text to American English, adjusting spelling (e.g., analyse → analyze, colour → color, centre → center), vocabulary (e.g., lift → elevator, flat → apartment), and date formats (DD/MM/YYYY → MM/DD/YYYY) as appropriate:

"${text}"

Return only the converted text without any explanation.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in English language variations. Convert text between British and American English accurately while preserving tone and meaning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return NextResponse.json({
        translatedText: completion.choices[0].message.content || text,
        targetLanguage,
        confidence: 0.95
      });
    }

    // General translation for other languages
    const systemPrompt = preserveFormatting
      ? 'You are a professional translator. Translate text accurately while preserving all formatting, HTML tags, markdown, and special characters. Maintain the exact structure and only translate the actual text content.'
      : 'You are a professional translator. Translate text accurately and naturally into the target language.';

    const prompt = `Translate the following text to ${targetLangName}:

"${text}"

${preserveFormatting ? 'Preserve all formatting, HTML tags, and special characters.' : ''}
Return only the translated text without any explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const translatedText = completion.choices[0].message.content || text;

    // Cache translation for performance
    // In production, you'd want to use Redis or similar

    return NextResponse.json({
      translatedText,
      targetLanguage,
      confidence: 0.9,
      cached: false
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}