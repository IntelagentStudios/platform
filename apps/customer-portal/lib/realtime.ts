// Store active connections
export const clients = new Map<string, ReadableStreamDefaultController>();

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
// import { sendUpdate, sendCustomEvent } from '@/lib/realtime';
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