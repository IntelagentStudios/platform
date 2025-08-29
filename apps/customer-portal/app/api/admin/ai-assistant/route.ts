import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    
    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      if (!decoded.isAdmin) {
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Forward the request to n8n webhook
    const webhookResponse = await fetch('https://intelagentchatbotn8n.up.railway.app/webhook/setup-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: body.query || body.message,
        productKey: 'admin-dashboard',
        customKnowledge: body.customKnowledge || ''
      })
    });
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('n8n webhook error:', errorText);
      
      // Fallback response if webhook fails
      return NextResponse.json({
        response: `I understand you're asking about: "${body.query || body.message}". 
        
Based on the current platform statistics, here's what I can tell you:
- You have ${body.stats?.totalLicenses || 0} total licenses
- ${body.stats?.activeLicenses || 0} are currently active
- ${body.stats?.totalUsers || 0} users are registered

While I'm having trouble connecting to the full AI service right now, I can help you with basic platform management tasks. What specific information would you like to know?`
      });
    }
    
    const data = await webhookResponse.json();
    
    // Return the response in a consistent format
    return NextResponse.json({
      response: data.response || data.message || data.output || data.text || 
                'I can help you manage your platform. What would you like to know?'
    });
    
  } catch (error) {
    console.error('AI assistant error:', error);
    
    // Provide a helpful fallback response
    return NextResponse.json({
      response: `I'm currently unable to connect to the AI service, but I can still help with basic information. 
      
You can:
- View and manage licenses in the Licenses section
- Check platform statistics on the Overview page
- Monitor user activity and system health
      
What would you like to know more about?`
    });
  }
}