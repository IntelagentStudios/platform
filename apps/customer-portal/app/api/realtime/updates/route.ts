import { NextRequest, NextResponse } from 'next/server';

// Store active connections
const clients = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const licenseKey = searchParams.get('license');

  if (!licenseKey) {
    return NextResponse.json(
      { error: 'License key required' },
      { status: 400 }
    );
  }

  // Create a new stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this client
      clients.set(licenseKey, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          id: 'connection',
          type: 'info',
          title: 'Connected',
          message: 'Real-time updates active',
          timestamp: new Date()
        })}\n\n`)
      );

      // Set up periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':heartbeat\n\n'));
        } catch (error) {
          clearInterval(heartbeat);
          clients.delete(licenseKey);
        }
      }, 30000); // Every 30 seconds

      // Simulate some updates (replace with real event emitters)
      setTimeout(() => {
        sendUpdate(licenseKey, {
          id: 'welcome',
          type: 'success',
          title: 'Welcome Back',
          message: 'Your dashboard is up to date',
          timestamp: new Date()
        });
      }, 2000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clients.delete(licenseKey);
        controller.close();
      });
    },

    cancel() {
      clients.delete(licenseKey);
    }
  });

  // Return SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}

// Helper function to send updates to specific clients
export function sendUpdate(licenseKey: string, update: any) {
  const controller = clients.get(licenseKey);
  if (controller) {
    const encoder = new TextEncoder();
    try {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
      );
    } catch (error) {
      // Client disconnected
      clients.delete(licenseKey);
    }
  }
}

// Helper function to send custom events
export function sendCustomEvent(licenseKey: string, event: string, data: any) {
  const controller = clients.get(licenseKey);
  if (controller) {
    const encoder = new TextEncoder();
    try {
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    } catch (error) {
      clients.delete(licenseKey);
    }
  }
}

// Helper function to broadcast to all clients
export function broadcast(update: any) {
  const encoder = new TextEncoder();
  const message = encoder.encode(`data: ${JSON.stringify(update)}\n\n`);
  
  clients.forEach((controller, licenseKey) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      clients.delete(licenseKey);
    }
  });
}

// Example usage from other parts of your app:
// import { sendUpdate, sendCustomEvent } from '@/app/api/realtime/updates/route';
// 
// // Send usage alert
// sendCustomEvent(licenseKey, 'usage-alert', {
//   product: 'chatbot',
//   percentage: 85,
//   severity: 'warning'
// });
//
// // Send product update
// sendCustomEvent(licenseKey, 'product-update', {
//   product: 'sales_agent',
//   message: 'New lead discovered and added to queue'
// });
//
// // Send AI insight
// sendCustomEvent(licenseKey, 'insight', {
//   summary: 'Chatbot conversations increased 23% this week',
//   recommendation: 'Consider adding more FAQ topics'
// });