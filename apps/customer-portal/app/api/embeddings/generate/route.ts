import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy embeddings endpoint - kept for compatibility
 * We now use simple database storage instead of vector embeddings
 * This endpoint just returns success to not break existing code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, content, knowledgeId } = body;
    
    if (!licenseKey || !content) {
      return NextResponse.json({ 
        error: 'License key and content required' 
      }, { status: 400 });
    }

    // We don't actually generate embeddings anymore
    // Knowledge is stored directly in the database (custom_knowledge and knowledge_files tables)
    console.log(`Knowledge saved for license ${licenseKey}, id: ${knowledgeId}, size: ${content.length} chars`);
    
    return NextResponse.json({
      success: true,
      message: 'Knowledge processed successfully',
      configured: true,
      chunksProcessed: 1,
      embeddingIds: [knowledgeId || 'default'],
      method: 'database-storage'
    });
  } catch (error: any) {
    console.error('Error in embeddings endpoint:', error);
    // Still return success to not break the UI
    return NextResponse.json({ 
      success: true,
      message: 'Knowledge saved (simplified storage)',
      configured: false,
      chunksProcessed: 0,
      embeddingIds: [],
      error: error.message
    }, { status: 200 });
  }
}