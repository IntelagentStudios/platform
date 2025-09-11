import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authToken = cookies().get('auth_token');
    let licenseKey = '';
    
    if (!authToken) {
      const oldAuth = cookies().get('auth');
      if (!oldAuth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (oldAuth.value === 'authenticated-user-harry') {
        licenseKey = 'INTL-AGNT-BOSS-MODE';
      } else if (oldAuth.value === 'authenticated-test-friend') {
        licenseKey = 'INTL-NW1S-QANW-2025';
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      try {
        const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
        licenseKey = decoded.licenseKey;
      } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productKey = formData.get('productKey') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Process the file based on type
    let content = '';
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    // For now, we'll extract text content from the file
    // In production, you'd use libraries like pdf-parse, mammoth, etc.
    if (fileType === 'txt' || fileType === 'csv') {
      // Text files can be read directly
      content = await file.text();
    } else {
      // For other file types, we'll store metadata for now
      // In production, you'd process these with appropriate libraries
      content = `[Document: ${file.name}]\nType: ${fileType}\nSize: ${(file.size / 1024).toFixed(2)}KB\n\n[Content extraction pending - integrate with document parser]`;
    }

    // Save to custom_knowledge table
    const existing = await prisma.custom_knowledge.findFirst({
      where: {
        license_key: licenseKey,
        knowledge_type: 'document'
      }
    });

    if (existing) {
      // Append to existing knowledge
      await prisma.custom_knowledge.update({
        where: { id: existing.id },
        data: {
          content: existing.content + '\n\n---\n\n' + content,
          instructions: existing.instructions + `\nLast upload: ${file.name} at ${new Date().toISOString()}`
        }
      });
    } else {
      // Create new knowledge entry
      await prisma.custom_knowledge.create({
        data: {
          license_key: licenseKey,
          product_key: productKey,
          knowledge_type: 'document',
          content: content,
          instructions: `Use this document content to answer user questions accurately.\nFirst upload: ${file.name} at ${new Date().toISOString()}`,
          is_active: true
        }
      });
    }

    // TODO: In production, integrate with n8n to update the chatbot's knowledge base
    // This would involve sending the content to n8n's webhook to update the AI context

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      fileName: file.name,
      fileType: fileType,
      contentLength: content.length
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process document' 
    }, { status: 500 });
  }
}