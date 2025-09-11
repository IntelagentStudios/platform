import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all knowledge for a license
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseKey = searchParams.get('licenseKey');
    
    if (!licenseKey) {
      return NextResponse.json({ 
        error: 'License key required' 
      }, { status: 400 });
    }

    // Get all knowledge entries for this license
    const knowledge = await prisma.custom_knowledge.findMany({
      where: { 
        license_key: licenseKey
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({
      knowledge,
      count: knowledge.length
    });
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch knowledge' 
    }, { status: 500 });
  }
}

// POST - Create new knowledge entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, content, knowledgeType = 'general' } = body;
    
    if (!licenseKey || !content) {
      return NextResponse.json({ 
        error: 'License key and content required' 
      }, { status: 400 });
    }

    // Get or create product key for this license
    const productKey = 'PK-' + licenseKey;
    
    // Create new knowledge entry
    const newKnowledge = await prisma.custom_knowledge.create({
      data: {
        license_key: licenseKey,
        product_key: productKey,
        content: content,
        knowledge_type: knowledgeType,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      knowledge: newKnowledge
    });
  } catch (error) {
    console.error('Error creating knowledge:', error);
    return NextResponse.json({ 
      error: 'Failed to create knowledge' 
    }, { status: 500 });
  }
}

// PUT - Update knowledge entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, knowledgeType, isActive } = body;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Knowledge ID required' 
      }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (content !== undefined) updateData.content = content;
    if (knowledgeType !== undefined) updateData.knowledge_type = knowledgeType;
    if (isActive !== undefined) updateData.is_active = isActive;

    const updatedKnowledge = await prisma.custom_knowledge.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      knowledge: updatedKnowledge
    });
  } catch (error) {
    console.error('Error updating knowledge:', error);
    return NextResponse.json({ 
      error: 'Failed to update knowledge' 
    }, { status: 500 });
  }
}

// DELETE - Delete knowledge entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Knowledge ID required' 
      }, { status: 400 });
    }

    await prisma.custom_knowledge.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Knowledge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    return NextResponse.json({ 
      error: 'Failed to delete knowledge' 
    }, { status: 500 });
  }
}