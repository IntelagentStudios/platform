import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Debug endpoint to test knowledge files
export async function GET(request: NextRequest) {
  const debugInfo: any = {
    step: 'start',
    auth: null,
    productKey: null,
    error: null,
    query: null,
    result: null
  };

  try {
    const cookieStore = await cookies();
    
    // Check for simple auth first
    const simpleAuth = cookieStore.get('auth');
    debugInfo.auth = simpleAuth?.value || 'no-simple-auth';
    
    let productKey = '';
    
    if (simpleAuth) {
      if (simpleAuth.value === 'authenticated-user-harry') {
        productKey = 'chat_9b3f7e8a2c5d1f0e';
      } else if (simpleAuth.value === 'authenticated-test-friend') {
        productKey = 'chat_james_nw1s_2025';
      }
    }
    
    debugInfo.productKey = productKey || 'no-product-key';
    
    // If no simple auth, check JWT
    if (!productKey) {
      const authToken = cookieStore.get('auth_token');
      if (!authToken) {
        debugInfo.step = 'no-auth';
        return NextResponse.json({ 
          debug: debugInfo,
          files: [],
          error: 'Unauthorized' 
        }, { status: 200 }); // Return 200 for debugging
      }
      
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(authToken.value, JWT_SECRET) as any;
        const licenseKey = decoded.licenseKey;
        
        debugInfo.licenseKey = licenseKey || 'no-license-key';
        
        if (!licenseKey) {
          debugInfo.step = 'no-license-key';
          return NextResponse.json({ 
            debug: debugInfo,
            files: [],
            error: 'No license key in token' 
          }, { status: 200 });
        }
        
        // Get product key from license
        debugInfo.step = 'fetching-product-key';
        const productKeyRecord = await prisma.product_keys.findFirst({
          where: {
            license_key: licenseKey,
            product: 'chatbot',
            status: 'active'
          },
          select: { product_key: true }
        });
        
        if (!productKeyRecord) {
          debugInfo.step = 'no-product-key-record';
          return NextResponse.json({ 
            debug: debugInfo,
            files: [],
            error: 'No chatbot configured' 
          }, { status: 200 });
        }
        
        productKey = productKeyRecord.product_key;
        debugInfo.productKey = productKey;
      } catch (error: any) {
        debugInfo.step = 'jwt-error';
        debugInfo.error = error.message;
        return NextResponse.json({ 
          debug: debugInfo,
          files: [],
          error: 'Invalid token' 
        }, { status: 200 });
      }
    }
    
    // Get all knowledge files for this product
    debugInfo.step = 'fetching-files';
    debugInfo.query = {
      where: {
        product_key: productKey
      }
    };
    
    try {
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
      
      debugInfo.step = 'success';
      debugInfo.result = `Found ${files.length} files`;
      
      return NextResponse.json({ 
        debug: debugInfo,
        files: files || [] 
      });
    } catch (dbError: any) {
      debugInfo.step = 'db-error';
      debugInfo.error = dbError.message;
      debugInfo.errorCode = dbError.code;
      
      // Check if it's a column not found error
      if (dbError.message?.includes('column') || dbError.code === 'P2022') {
        debugInfo.suggestion = 'Database schema may be out of sync';
      }
      
      return NextResponse.json({ 
        debug: debugInfo,
        files: [],
        error: 'Database query failed' 
      }, { status: 200 });
    }
  } catch (error: any) {
    debugInfo.step = 'general-error';
    debugInfo.error = error.message;
    
    return NextResponse.json({ 
      debug: debugInfo,
      files: [],
      error: 'Failed to fetch knowledge files' 
    }, { status: 200 });
  }
}