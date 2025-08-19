import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { redis, pubClient, subClient } from './redis';
import { logger } from './monitoring';
import { SessionManager } from './security';
import jwt from 'jsonwebtoken';

export interface WebSocketMessage {
  type: string;
  channel: string;
  data: any;
  timestamp: string;
}

export class WebSocketManager {
  private io: SocketIOServer | null = null;
  private connections = new Map<string, Socket>();
  private channels = new Map<string, Set<string>>();
  private userSessions = new Map<string, Set<string>>();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscriptions();

    logger.info('WebSocket server initialized');
  }

  private setupMiddleware() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const session = await SessionManager.verify(decoded.session_id);

        if (!session.valid) {
          return next(new Error('Invalid session'));
        }

        socket.data.userId = session.userId;
        socket.data.session_id = decoded.session_id;
        
        next();
      } catch (error) {
        logger.error({ error }, 'WebSocket authentication failed');
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      const socketId = socket.id;

      logger.info({ userId, socketId }, 'WebSocket client connected');

      // Track connection
      this.connections.set(socketId, socket);
      
      // Track user sessions
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId)!.add(socketId);

      // Join user's personal channel
      socket.join(`user:${userId}`);

      // Handle channel subscriptions
      socket.on('subscribe', (channel: string) => {
        this.subscribeToChannel(socket, channel);
      });

      socket.on('unsubscribe', (channel: string) => {
        this.unsubscribeFromChannel(socket, channel);
      });

      // Handle real-time messages
      socket.on('message', async (message: WebSocketMessage) => {
        await this.handleMessage(socket, message);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info({ userId, socketId }, 'WebSocket client disconnected');
        
        // Clean up connections
        this.connections.delete(socketId);
        
        // Clean up user sessions
        const userSocketIds = this.userSessions.get(userId);
        if (userSocketIds) {
          userSocketIds.delete(socketId);
          if (userSocketIds.size === 0) {
            this.userSessions.delete(userId);
          }
        }

        // Clean up channel subscriptions
        this.channels.forEach((subscribers, channel) => {
          subscribers.delete(socketId);
          if (subscribers.size === 0) {
            this.channels.delete(channel);
          }
        });
      });

      // Send initial connection success
      socket.emit('connected', {
        socketId,
        userId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupRedisSubscriptions() {
    // Subscribe to Redis pub/sub channels
    subClient.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        this.broadcastToChannel(channel, data);
      } catch (error) {
        logger.error({ error, channel, message }, 'Failed to parse Redis message');
      }
    });

    // Subscribe to system channels
    subClient.subscribe('system:alerts');
    subClient.subscribe('system:metrics');
    subClient.subscribe('service:health');
    subClient.subscribe('errors:new');
    subClient.subscribe('queue:updates');
  }

  private subscribeToChannel(socket: Socket, channel: string) {
    // Validate channel access
    if (!this.canAccessChannel(socket.data.userId, channel)) {
      socket.emit('error', { message: 'Access denied to channel' });
      return;
    }

    socket.join(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
      subClient.subscribe(channel);
    }
    this.channels.get(channel)!.add(socket.id);

    socket.emit('subscribed', { channel });
    logger.debug({ userId: socket.data.userId, channel }, 'Subscribed to channel');
  }

  private unsubscribeFromChannel(socket: Socket, channel: string) {
    socket.leave(channel);

    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.delete(socket.id);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
        subClient.unsubscribe(channel);
      }
    }

    socket.emit('unsubscribed', { channel });
    logger.debug({ userId: socket.data.userId, channel }, 'Unsubscribed from channel');
  }

  private canAccessChannel(userId: string, channel: string): boolean {
    // Implement channel access control
    if (channel.startsWith('user:')) {
      return channel === `user:${userId}`;
    }

    if (channel.startsWith('admin:')) {
      // Check if user has admin role
      // This should be implemented based on your auth system
      return true; // Placeholder
    }

    // Public channels
    const publicChannels = ['system:status', 'service:health'];
    return publicChannels.includes(channel);
  }

  private async handleMessage(socket: Socket, message: WebSocketMessage) {
    try {
      // Validate message
      if (!message.type || !message.channel) {
        socket.emit('error', { message: 'Invalid message format' });
        return;
      }

      // Check permissions
      if (!this.canSendToChannel(socket.data.userId, message.channel)) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Add metadata
      const enrichedMessage = {
        ...message,
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      };

      // Publish to Redis for distribution
      await pubClient.publish(message.channel, JSON.stringify(enrichedMessage));

      // Log message
      logger.debug({ userId: socket.data.userId, message }, 'Message sent');
    } catch (error) {
      logger.error({ error, message }, 'Failed to handle message');
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private canSendToChannel(userId: string, channel: string): boolean {
    // Implement send permissions
    // For now, only allow sending to user's own channel
    return channel === `user:${userId}` || channel.startsWith('admin:');
  }

  // Public methods for sending messages
  broadcastToChannel(channel: string, data: any) {
    if (!this.io) return;

    this.io.to(channel).emit('message', {
      channel,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    if (!this.io) return;

    this.io.emit(event, data);
  }

  // System notifications
  async sendSystemAlert(alert: {
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    service?: string;
    metadata?: any;
  }) {
    const message = {
      type: 'system:alert',
      channel: 'system:alerts',
      data: alert,
      timestamp: new Date().toISOString(),
    };

    await pubClient.publish('system:alerts', JSON.stringify(message));
    this.broadcastToChannel('admin:alerts', message);
  }

  async sendMetricsUpdate(metrics: any) {
    const message = {
      type: 'metrics:update',
      channel: 'system:metrics',
      data: metrics,
      timestamp: new Date().toISOString(),
    };

    await pubClient.publish('system:metrics', JSON.stringify(message));
    this.broadcastToChannel('admin:metrics', message);
  }

  async sendServiceHealthUpdate(service: string, health: any) {
    const message = {
      type: 'health:update',
      channel: 'service:health',
      data: { service, health },
      timestamp: new Date().toISOString(),
    };

    await pubClient.publish('service:health', JSON.stringify(message));
    this.broadcastToChannel('admin:health', message);
  }

  async sendErrorNotification(error: any) {
    const message = {
      type: 'error:new',
      channel: 'errors:new',
      data: error,
      timestamp: new Date().toISOString(),
    };

    await pubClient.publish('errors:new', JSON.stringify(message));
    this.broadcastToChannel('admin:errors', message);
  }

  async sendQueueUpdate(queueName: string, stats: any) {
    const message = {
      type: 'queue:stats',
      channel: 'queue:updates',
      data: { queue: queueName, stats },
      timestamp: new Date().toISOString(),
    };

    await pubClient.publish('queue:updates', JSON.stringify(message));
    this.broadcastToChannel('admin:queues', message);
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.userSessions.size,
      channels: Array.from(this.channels.keys()),
      users: Array.from(this.userSessions.entries()).map(([userId, sockets]) => ({
        userId,
        connections: sockets.size,
      })),
    };
  }

  // Graceful shutdown
  async shutdown() {
    if (!this.io) return;

    // Notify all clients
    this.broadcastToAll('server:shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString(),
    });

    // Close all connections
    this.io.disconnectSockets(true);

    // Close server
    await new Promise<void>((resolve) => {
      this.io!.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}

export const wsManager = new WebSocketManager();