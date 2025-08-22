import { NextRequest, NextResponse } from 'next/server';
import { clients, sendUpdate } from '@/lib/realtime';

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