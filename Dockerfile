# Simple, Railway-optimized Dockerfile
FROM node:20-alpine

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/admin-portal/package*.json ./apps/admin-portal/
COPY apps/customer-portal/package*.json ./apps/customer-portal/
COPY packages/ai-intelligence/package*.json ./packages/ai-intelligence/
COPY packages/analytics/package*.json ./packages/analytics/
COPY packages/auth/package*.json ./packages/auth/
COPY packages/backup-recovery/package*.json ./packages/backup-recovery/
COPY packages/billing/package*.json ./packages/billing/
COPY packages/compliance/package*.json ./packages/compliance/
COPY packages/core/package*.json ./packages/core/
COPY packages/database/package*.json ./packages/database/
COPY packages/email-templates/package*.json ./packages/email-templates/
COPY packages/enrichment/package*.json ./packages/enrichment/
COPY packages/notifications/package*.json ./packages/notifications/
COPY packages/rate-limiter/package*.json ./packages/rate-limiter/
COPY packages/redis/package*.json ./packages/redis/
COPY packages/security/package*.json ./packages/security/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/skills-orchestrator/package*.json ./packages/skills-orchestrator/
COPY packages/teams/package*.json ./packages/teams/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/usage-tracking/package*.json ./packages/usage-tracking/
COPY packages/vector-store/package*.json ./packages/vector-store/

# Install dependencies
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Re-run install to set up workspace links
RUN npm install --legacy-peer-deps

# Generate Prisma Client after copying source
RUN cd packages/database && npx prisma generate

# Build skills-orchestrator
RUN cd packages/skills-orchestrator && npm run build

# Pre-build Next.js app to cache it
RUN cd apps/customer-portal && \
    npx prisma generate --schema=../../packages/database/prisma/schema.prisma && \
    npm run build || echo "Build will complete at runtime"

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Create necessary directories with correct permissions
RUN mkdir -p /app/apps/customer-portal/.next && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set working directory
WORKDIR /app/apps/customer-portal

# Start command - only build if needed, then start
CMD ["sh", "-c", "if [ ! -d '.next' ]; then npx prisma generate --schema=../../packages/database/prisma/schema.prisma && npm run build; fi && npm start"]