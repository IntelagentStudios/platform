# Multi-stage build for optimal caching and smaller final image
FROM node:20-alpine AS base

# Install dependencies needed for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev libc6-compat

WORKDIR /app

# --- Dependencies Stage ---
FROM base AS deps

# Copy package files for dependency installation
COPY package*.json ./
COPY apps/admin-portal/package*.json ./apps/admin-portal/
COPY apps/customer-portal/package*.json ./apps/customer-portal/
COPY packages/*/package*.json ./packages/
COPY products/*/package*.json ./products/ 2>/dev/null || true
COPY services/*/package*.json ./services/ 2>/dev/null || true

# Install dependencies with better caching
RUN npm ci --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps --ignore-scripts

# --- Source Stage ---
FROM base AS source

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin-portal/node_modules ./apps/admin-portal/node_modules
COPY --from=deps /app/apps/customer-portal/node_modules ./apps/customer-portal/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/

# Copy source code
COPY . .

# Generate Prisma Client
RUN cd packages/database && npx prisma generate

# Build packages that need building
RUN cd packages/skills-orchestrator && npm run build

# --- Runtime Stage ---
FROM base AS runtime

# Copy everything from source stage
COPY --from=source /app /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user to run the app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Create .next cache directory with correct permissions
RUN mkdir -p /app/apps/customer-portal/.next && \
    chown -R nextjs:nodejs /app/apps/customer-portal

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set working directory
WORKDIR /app/apps/customer-portal

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Create start script inline (avoids COPY issues)
RUN echo '#!/bin/sh\n\
set -e\n\
echo "🚀 Starting Intelagent Platform Customer Portal..."\n\
if [ -f ".next/BUILD_ID" ]; then\n\
    echo "✅ Found existing Next.js build cache"\n\
    if [ -f ".next/package.json.checksum" ]; then\n\
        CURRENT_CHECKSUM=$(md5sum package.json 2>/dev/null || sha256sum package.json)\n\
        CACHED_CHECKSUM=$(cat .next/package.json.checksum)\n\
        if [ "$CURRENT_CHECKSUM" = "$CACHED_CHECKSUM" ]; then\n\
            echo "✅ Build cache is valid, skipping rebuild"\n\
        else\n\
            echo "⚠️  Dependencies changed, rebuilding..."\n\
            rm -rf .next\n\
        fi\n\
    fi\n\
fi\n\
if [ ! -d "../../packages/database/node_modules/.prisma/client" ]; then\n\
    echo "📦 Generating Prisma client..."\n\
    npx prisma generate --schema=../../packages/database/prisma/schema.prisma\n\
else\n\
    echo "✅ Prisma client already generated"\n\
fi\n\
if [ ! -f ".next/BUILD_ID" ]; then\n\
    echo "🔨 Building Next.js application..."\n\
    npm run build\n\
    if [ -d ".next" ]; then\n\
        md5sum package.json 2>/dev/null > .next/package.json.checksum || sha256sum package.json > .next/package.json.checksum\n\
    fi\n\
else\n\
    echo "✅ Using cached Next.js build"\n\
fi\n\
echo "🌟 Starting production server on port ${PORT:-3000}..."\n\
exec npm start' > /app/docker-start.sh && \
    chmod +x /app/docker-start.sh && \
    chown nextjs:nodejs /app/docker-start.sh

# Use the start script
CMD ["/app/docker-start.sh"]