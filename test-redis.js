const Redis = require('ioredis');

// Test Redis connection with Railway credentials
async function testRedisConnection() {
  console.log('Testing Redis connection to Railway...\n');
  
  const redis = new Redis({
    host: 'redis.railway.internal',
    port: 6379,
    username: 'default',
    password: 'P-B8cx~UfywBhSKYs5jb-nx_S3Q-G0IG',
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Retry attempt ${times}, waiting ${delay}ms...`);
      return delay;
    }
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Redis successfully!');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  try {
    // Test basic operations
    console.log('\nTesting basic operations:');
    
    // Set a value
    await redis.set('test:key', 'Hello from Intelagent Platform!');
    console.log('✅ SET operation successful');
    
    // Get the value
    const value = await redis.get('test:key');
    console.log(`✅ GET operation successful: "${value}"`);
    
    // Test pub/sub
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    
    await subClient.subscribe('test:channel');
    console.log('✅ Subscribe operation successful');
    
    await pubClient.publish('test:channel', 'Test message');
    console.log('✅ Publish operation successful');
    
    // Cleanup
    await redis.del('test:key');
    await subClient.unsubscribe('test:channel');
    
    console.log('\n✨ All Redis operations completed successfully!');
    console.log('\nRedis configuration is working correctly with Railway.');
    
    // Close connections
    await redis.quit();
    await pubClient.quit();
    await subClient.quit();
    
  } catch (error) {
    console.error('\n❌ Redis operation failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Railway Redis service is running');
    console.error('2. You are deployed on Railway (internal URLs only work on Railway)');
    console.error('3. For local development, use the external Redis URL instead');
  }
}

testRedisConnection().catch(console.error);