const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

// Import our custom modules (will be compiled from TS)
const startServices = async () => {
  // Dynamic imports for TypeScript modules
  const { redis, initializeRedis } = await import('./lib/redis.js');
  const { initMonitoring, logger } = await import('./lib/monitoring.js');
  const { initializeQueues, QueueManager, Queues } = await import('./lib/queues.js');
  const { wsManager } = await import('./lib/websocket-manager.js');
  const { startSystemMonitoring } = await import('./lib/system-monitor.js');
  const { HealthChecker } = await import('./lib/monitoring.js');

  const dev = process.env.NODE_ENV !== 'production';
  const hostname = '0.0.0.0';
  const port = process.env.PORT || 3000;

  // Initialize Next.js
  const nextApp = next({ dev, hostname, port });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  // Create Express app
  const app = express();
  const server = createServer(app);

  // Initialize monitoring
  initMonitoring();

  // Initialize Redis
  await initializeRedis();

  // Initialize queues
  initializeQueues();

  // Initialize WebSocket server
  wsManager.initialize(server);

  // Start system monitoring
  startSystemMonitoring();

  // Setup Bull Board for queue monitoring
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/bull-board');

  const bullBoard = createBullBoard({
    queues: [
      new BullMQAdapter(QueueManager.getQueue(Queues.EMAIL)),
      new BullMQAdapter(QueueManager.getQueue(Queues.ENRICHMENT)),
      new BullMQAdapter(QueueManager.getQueue(Queues.ANALYTICS)),
      new BullMQAdapter(QueueManager.getQueue(Queues.EXPORT)),
      new BullMQAdapter(QueueManager.getQueue(Queues.NOTIFICATION)),
      new BullMQAdapter(QueueManager.getQueue(Queues.WEBHOOK)),
    ],
    serverAdapter,
  });

  // Middleware
  app.use(compression());
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for Next.js
  }));
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://dashboard.intelagentstudios.com', 'https://*.up.railway.app']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Bull Board UI
  app.use('/admin/bull-board', serverAdapter.getRouter());

  // Health check endpoints
  app.get('/health', async (req, res) => {
    const health = await HealthChecker.checkAll();
    const isHealthy = await HealthChecker.isHealthy();
    res.status(isHealthy ? 200 : 503).json(health);
  });

  app.get('/health/ready', async (req, res) => {
    const ready = await redis.ping() === 'PONG';
    res.status(ready ? 200 : 503).json({ ready });
  });

  app.get('/health/live', (req, res) => {
    res.status(200).json({ alive: true });
  });

  // Metrics endpoint (Prometheus format)
  app.get('/metrics', async (req, res) => {
    const { metrics } = await import('./lib/redis.js');
    const metricsData = await metrics.getMetrics();
    
    res.set('Content-Type', 'text/plain');
    let output = '';
    
    for (const [key, value] of Object.entries(metricsData)) {
      output += `# TYPE ${key} gauge\n`;
      output += `${key} ${value}\n`;
    }
    
    res.send(output);
  });

  // WebSocket stats endpoint
  app.get('/api/websocket/stats', (req, res) => {
    const stats = wsManager.getConnectionStats();
    res.json(stats);
  });

  // Queue stats endpoint
  app.get('/api/queues/stats', async (req, res) => {
    const stats = await QueueManager.getAllQueuesStats();
    res.json(stats);
  });

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      }, 'HTTP Request');

      // Update metrics
      metrics.increment('http:requests:total');
      metrics.histogram('http:request:duration', duration);
      
      if (res.statusCode >= 400) {
        metrics.increment('http:requests:errors');
      }
    });
    
    next();
  });

  // Rate limiting for API routes
  app.use('/api', async (req, res, next) => {
    const { rateLimiters } = await import('./lib/security.js');
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      await rateLimiters.api.consume(ip);
      next();
    } catch (error) {
      res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: error.msBeforeNext / 1000,
      });
    }
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error({ error: err, url: req.url }, 'Unhandled error');
    
    // Send error to monitoring
    wsManager.sendErrorNotification({
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    res.status(500).json({ 
      error: 'Internal server error',
      message: dev ? err.message : undefined,
    });
  });

  // Handle all other routes with Next.js
  app.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  // Register health checks
  HealthChecker.register('redis', async () => {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  });

  HealthChecker.register('database', async () => {
    try {
      // Check database connection
      const { prisma } = await import('@/lib/db.js');
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    logger.info({ signal }, 'Received shutdown signal');
    
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Shutdown services
    await wsManager.shutdown();
    await QueueManager.shutdown();
    await redis.quit();
    
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Start server
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    
    logger.info({
      port,
      hostname,
      environment: process.env.NODE_ENV,
      pid: process.pid,
    }, 'Server started successfully');
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 INTELAGENT PLATFORM - ENTERPRISE EDITION               ║
║                                                              ║
║   Status:     OPERATIONAL                                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}     ║
║   Port:       ${port}                                       ║
║                                                              ║
║   Services:                                                 ║
║   ✅ Redis Cache & Queues                                   ║
║   ✅ WebSocket Real-time                                    ║
║   ✅ System Monitoring                                      ║
║   ✅ Queue Processing                                       ║
║   ✅ Security Layer                                         ║
║                                                              ║
║   Admin Dashboard: http://${hostname}:${port}/admin         ║
║   Bull Board:     http://${hostname}:${port}/admin/bull-board ║
║   Health Check:   http://${hostname}:${port}/health         ║
║   Metrics:        http://${hostname}:${port}/metrics        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
};

// Start the server
startServices().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});