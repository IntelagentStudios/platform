import '@testing-library/jest-dom';

// Mock environment variables using Object.defineProperty to avoid read-only errors
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
  configurable: true,
  enumerable: true
});

Object.defineProperty(process.env, 'JWT_SECRET', {
  value: 'test-secret',
  writable: true,
  configurable: true,
  enumerable: true
});

Object.defineProperty(process.env, 'REDIS_URL', {
  value: 'redis://localhost:6379',
  writable: true,
  configurable: true,
  enumerable: true
});

Object.defineProperty(process.env, 'DATABASE_URL', {
  value: 'postgresql://test:test@localhost:5432/test',
  writable: true,
  configurable: true,
  enumerable: true
});

// Polyfills for Node.js environment - only add if not already present
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Mock fetch for tests
global.fetch = jest.fn();

// Mock Redis client
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    setex: jest.fn(),
    hgetall: jest.fn(),
    hset: jest.fn(),
    lpush: jest.fn(),
    lrange: jest.fn(),
    ltrim: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
    quit: jest.fn(),
  },
  pubClient: {
    publish: jest.fn(),
  },
  subClient: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    on: jest.fn(),
  },
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flush: jest.fn(),
    keys: jest.fn(),
  },
  metrics: {
    increment: jest.fn(),
    gauge: jest.fn(),
    histogram: jest.fn(),
    getMetrics: jest.fn(),
  },
}));

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

// Mock WebSocket manager
jest.mock('@/lib/websocket-manager', () => ({
  wsManager: {
    initialize: jest.fn(),
    broadcastToChannel: jest.fn(),
    sendToUser: jest.fn(),
    broadcastToAll: jest.fn(),
    sendSystemAlert: jest.fn(),
    sendMetricsUpdate: jest.fn(),
    sendServiceHealthUpdate: jest.fn(),
    sendErrorNotification: jest.fn(),
    sendQueueUpdate: jest.fn(),
    getConnectionStats: jest.fn(),
    shutdown: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/monitoring', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  initMonitoring: jest.fn(),
  PerformanceMonitor: {
    startTimer: jest.fn(),
    endTimer: jest.fn(),
    measureAsync: jest.fn((label, fn) => fn()),
  },
  HealthChecker: {
    register: jest.fn(),
    checkAll: jest.fn(),
    isHealthy: jest.fn(() => Promise.resolve(true)),
  },
  auditLog: {
    log: jest.fn(),
  },
  errorReporter: {
    report: jest.fn(),
    reportWarning: jest.fn(),
  },
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});