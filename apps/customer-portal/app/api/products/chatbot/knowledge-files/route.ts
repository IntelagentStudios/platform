import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'knowledge-base');

// GET - List all knowledge files for a product
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const simpleAuth = cookieStore.get('simple-auth');
    
    if (!simpleAuth || simpleAuth.value !== 'authenticated-user-harry') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productKey = 'chat_9b3f7e8a2c5d1f0e';
    
    // Get knowledge file metadata from database
    const knowledgeFiles = await prisma.custom_knowledge.findMany({
      where: {
        product_key: productKey,
        is_active: true
      },
      select: {
        id: true,
        knowledge_type: true,
        content: true, // This will store file metadata as JSON
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Parse metadata from content field
    const files = knowledgeFiles.map(kf => {
      try {
        const metadata = JSON.parse(kf.content);
        return {
          id: kf.id,
          name: metadata.filename,
          type: metadata.filetype,
          size: metadata.size,
          hash: metadata.hash,
          uploadedAt: kf.created_at,
          lastModified: kf.updated_at
        };
      } catch {
        // Legacy text content
        return {
          id: kf.id,
          name: 'Legacy Knowledge',
          type: 'text',
          size: kf.content.length,
          content: kf.content,
          uploadedAt: kf.created_at,
          lastModified: kf.updated_at
        };
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

    // Create product directory if it doesn't exist
    const productDir = path.join(KNOWLEDGE_BASE_DIR, productKey);
    await fs.mkdir(productDir, { recursive: true });

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename with hash
    const hash = createHash('md5').update(buffer).digest('hex');
    const fileExt = path.extname(file.name);
    const filename = `${Date.now()}_${hash}${fileExt}`;
    const filepath = path.join(productDir, filename);
    
    // Save file to disk
    await fs.writeFile(filepath, buffer);
    
    // Get product key info
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: { license_key: true }
    });

    if (!productKeyInfo) {
      return NextResponse.json({ error: 'Invalid product key' }, { status: 400 });
    }

    // Store metadata in database
    const metadata = {
      filename: file.name,
      storedAs: filename,
      filetype: file.type,
      size: buffer.length,
      hash: hash,
      path: filepath
    };

    const knowledgeEntry = await prisma.custom_knowledge.create({
      data: {
        product_key: productKey,
        license_key: productKeyInfo.license_key,
        knowledge_type: 'file',
        content: JSON.stringify(metadata),
        is_active: true,
        created_by: 'user'
      }
    });

    // Extract text content based on file type
    let textContent = '';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      textContent = buffer.toString('utf-8');
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      try {
        const jsonData = JSON.parse(buffer.toString('utf-8'));
        textContent = JSON.stringify(jsonData, null, 2);
      } catch {
        textContent = buffer.toString('utf-8');
      }
    }
    // For other file types (PDF, Word, etc.), you'd need specialized libraries
    
    // Generate embeddings if we extracted text
    if (textContent) {
      try {
        await fetch(`${request.nextUrl.origin}/api/embeddings/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey: productKeyInfo.license_key,
            productKey: productKey,
            content: textContent,
            knowledgeId: knowledgeEntry.id,
            namespace: productKey
          })
        });
      } catch (error) {
        console.error('Failed to generate embeddings:', error);
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        id: knowledgeEntry.id,
        name: file.name,
        type: file.type,
        size: buffer.length,
        hash: hash
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

    // Get file metadata
    const knowledgeEntry = await prisma.custom_knowledge.findUnique({
      where: { id: fileId }
    });

    if (!knowledgeEntry) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Try to parse as file metadata
    try {
      const metadata = JSON.parse(knowledgeEntry.content);
      if (metadata.path) {
        // Delete physical file
        await fs.unlink(metadata.path).catch(() => {
          // File might not exist, that's okay
        });
      }
    } catch {
      // Legacy text content, no file to delete
    }

    // Mark as inactive in database (soft delete)
    await prisma.custom_knowledge.update({
      where: { id: fileId },
      data: { is_active: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge file:', error);
    return NextResponse.json({ 
      error: 'Failed to delete file' 
    }, { status: 500 });
  }
}