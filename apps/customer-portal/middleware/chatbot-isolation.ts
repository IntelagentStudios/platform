/**
 * Chatbot Isolation Middleware
 * Ensures chatbot requests bypass the skills system
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define isolated chatbot routes
const ISOLATED_CHATBOT_ROUTES = [
  '/api/chatbot',  // This now covers /api/chatbot/[siteKey] as well
  '/api/widget',   // Widget configuration and dynamic scripts
  '/api/webhook/chatbot', // Chatbot webhook endpoint
  '/chatbot-widget.js',
  '/chatbot-widget.css'
];

// Define skills system routes to protect from
const SKILLS_SYSTEM_ROUTES = [
  '/api/skills',
  '/api/execute-skill',
  '/api/workflow',
  '/api/orchestrator'
];

export function chatbotIsolationMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if this is a chatbot route
  const isChatbotRoute = ISOLATED_CHATBOT_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (isChatbotRoute) {
    // Set isolation headers
    const response = NextResponse.next();
    
    // Mark as isolated request
    response.headers.set('X-Chatbot-Isolated', 'true');
    response.headers.set('X-Bypass-Skills', 'true');
    response.headers.set('X-Service-Priority', 'critical');
    
    // Prevent skills middleware from processing
    response.headers.set('X-Skip-Skills-Middleware', 'true');
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    
    return response;
  }
  
  // Check if skills system is trying to access chatbot
  const isSkillsRoute = SKILLS_SYSTEM_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (isSkillsRoute) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    
    // Prevent skills from calling chatbot directly
    if (referer.includes('chatbot') || origin.includes('chatbot')) {
      console.warn('Skills system attempted to access chatbot - blocked');
      return NextResponse.json(
        { error: 'Access denied: Chatbot is isolated from skills system' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

// Validate chatbot request
export function validateChatbotRequest(request: NextRequest): boolean {
  // For now, allow all chatbot requests - we'll rely on the product key validation in the API
  return true;
}

// Check if request should bypass skills
export function shouldBypassSkills(pathname: string): boolean {
  return ISOLATED_CHATBOT_ROUTES.some(route => pathname.startsWith(route));
}