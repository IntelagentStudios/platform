import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET - List all knowledge files for a product
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const simpleAuth = cookieStore.get('simple-auth');
    
    if (!simpleAuth || simpleAuth.value !== 'authenticated-user-harry') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productKey = 'chat_9b3f7e8a2c5d1f0e';
    
    // Get all knowledge files for this product
    const files = await prisma.knowledge_files.findMany({
      where: {
        product_key: productKey
      },
      select: {
        id: true,
        filename: true,
        file_type: true,
        file_size: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching knowledge files:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch knowledge files' 
    }, { status: 500 });
  }
}

// POST - Upload a new knowledge file
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const simpleAuth = cookieStore.get('simple-auth');
    
    if (!simpleAuth || simpleAuth.value !== 'authenticated-user-harry') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productKey = formData.get('productKey') as string || 'chat_9b3f7e8a2c5d1f0e';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const content = new TextDecoder().decode(bytes);
    
    // Get product key info for license key
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: { license_key: true }
    });

    if (!productKeyInfo) {
      return NextResponse.json({ error: 'Invalid product key' }, { status: 400 });
    }

    // Store file in database
    const knowledgeFile = await prisma.knowledge_files.create({
      data: {
        product_key: productKey,
        license_key: productKeyInfo.license_key,
        filename: file.name,
        content: content,
        file_type: file.type || 'text/plain',
        file_size: bytes.byteLength
      }
    });

    // Generate embeddings for the content
    try {
      await fetch(`${request.nextUrl.origin}/api/embeddings/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: productKeyInfo.license_key,
          productKey: productKey,
          content: content,
          knowledgeId: knowledgeFile.id,
          namespace: productKey
        })
      });
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      file: {
        id: knowledgeFile.id,
        filename: file.name,
        file_type: file.type,
        file_size: bytes.byteLength
      }
    });
  } catch (error) {
    console.error('Error uploading knowledge file:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
}

// DELETE - Remove a knowledge file
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const simpleAuth = cookieStore.get('simple-auth');
    
    if (!simpleAuth || simpleAuth.value !== 'authenticated-user-harry') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Delete from database
    await prisma.knowledge_files.delete({
      where: { id: fileId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge file:', error);
    return NextResponse.json({ 
      error: 'Failed to delete file' 
    }, { status: 500 });
  }
}

// PUT - Update a knowledge file
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const simpleAuth = cookieStore.get('simple-auth');
    
    if (!simpleAuth || simpleAuth.value !== 'authenticated-user-harry') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, content, filename } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Update in database
    const updated = await prisma.knowledge_files.update({
      where: { id },
      data: {
        ...(content && { content }),
        ...(filename && { filename }),
        updated_at: new Date()
      }
    });

    // Regenerate embeddings if content changed
    if (content) {
      const productKeyInfo = await prisma.product_keys.findUnique({
        where: { product_key: updated.product_key },
        select: { license_key: true }
      });

      if (productKeyInfo) {
        try {
          await fetch(`${request.nextUrl.origin}/api/embeddings/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              licenseKey: productKeyInfo.license_key,
              productKey: updated.product_key,
              content: content,
              knowledgeId: id,
              namespace: updated.product_key,
              forceRegenerate: true
            })
          });
        } catch (error) {
          console.error('Failed to regenerate embeddings:', error);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      file: updated
    });
  } catch (error) {
    console.error('Error updating knowledge file:', error);
    return NextResponse.json({ 
      error: 'Failed to update file' 
    }, { status: 500 });
  }
}