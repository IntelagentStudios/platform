# Redis Configuration for Railway

## Problem
Railway's internal networking (e.g., `redis.railway.internal`) is only available when services are running, not during the build phase. This causes build failures when the app tries to connect to Redis during build.

## Solution: Use Public Redis URL

### Step 1: Enable Public Networking on Redis
1. Go to your Redis service in Railway
2. Click on the **Settings** tab
3. Enable **Public Networking**
4. Wait for the public endpoint to be provisioned

### Step 2: Get the Public Redis URL
1. Go to the **Connect** tab in your Redis service
2. Copy the **Public Network** Redis URL
   - It will look like: `redis://default:password@viaduct.proxy.rlwy.net:12345`

### Step 3: Set Environment Variables
In your Railway app service, set these environment variables:

```bash
# Primary - Use the public URL
REDIS_PUBLIC_URL=redis://default:your-password@viaduct.proxy.rlwy.net:your-port

# Keep the internal URL as fallback (optional)
REDIS_URL=redis://default:password@redis.railway.internal:6379
```

### How It Works
1. **During Build**: The app uses the public Redis URL (if needed) or skips Redis entirely
2. **During Runtime**: The app prefers the public URL but can fall back to internal URL
3. **Performance**: Once deployed, you can remove `REDIS_PUBLIC_URL` to use only the internal URL for better performance (optional)

### Environment Variable Priority
The Redis package checks for URLs in this order:
1. `REDIS_PUBLIC_URL` - Public network URL (works everywhere)
2. `REDIS_URL_PUBLIC` - Alternative name for public URL
3. `REDIS_URL` - Standard Redis URL (skipped if internal during build)
4. Individual parameters (`REDISHOST`, `REDISPORT`, etc.)

### Benefits
- ✅ Build completes successfully
- ✅ Redis available during build if needed
- ✅ Works in all environments
- ✅ Can switch to internal URL later for performance

### Security Note
The public Redis URL is protected by password authentication. However, for production:
- Consider using IP allowlisting if Railway supports it
- Monitor Redis access logs
- Use strong passwords
- Rotate credentials regularly