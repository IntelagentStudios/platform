# Multi-stage optimized Dockerfile for production
# Stage 1: Dependencies
# Using Alpine Linux base and installing Node.js to bypass Docker Hub issues
FROM alpine:3.20 AS deps
RUN apk add --no-cache nodejs npm
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package.json files for dependency resolution
COPY apps/customer-portal/package*.json ./apps/customer-portal/
COPY packages/*/package*.json ./packages/

# Install dependencies with better caching
RUN npm ci --legacy-peer-deps --ignore-scripts && \
    npm cache clean --force

# Stage 2: Builder
FROM alpine:3.20 AS builder
RUN apk add --no-cache nodejs npm
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/customer-portal/node_modules ./apps/customer-portal/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Set environment for Prisma
ENV PRISMA_BINARIES_MIRROR=https://binaries.prisma.sh
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Generate Prisma Client with proper binary targets
RUN cd packages/database && \
    npx prisma generate --schema=./prisma/schema.prisma

# Build skills-orchestrator package
RUN cd packages/skills-orchestrator && npm run build

# Build Next.js application with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/customer-portal && \
    npm run build && \
    # Clean up unnecessary files
    rm -rf .next/cache

# Stage 3: Runner - minimal production image
FROM alpine:3.20 AS runner
RUN apk add --no-cache nodejs
RUN apk add --no-cache libc6-compat openssl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV PRISMA_BINARIES_MIRROR=https://binaries.prisma.sh

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-portal/public ./apps/customer-portal/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-portal/.next ./apps/customer-portal/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-portal/server.js ./apps/customer-portal/server.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-portal/package*.json ./apps/customer-portal/
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-portal/next.config.mjs ./apps/customer-portal/

# Copy node_modules (optimized - only production deps)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-portal/node_modules ./apps/customer-portal/node_modules

# Copy packages for runtime
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Set working directory for runtime
WORKDIR /app/apps/customer-portal

# Start the application
CMD ["npm", "start"]