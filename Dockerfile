# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev libc6-compat

WORKDIR /app

# Copy all package.json files first for better caching
COPY package*.json ./
COPY apps/admin-portal/package*.json ./apps/admin-portal/
COPY apps/customer-portal/package*.json ./apps/customer-portal/

# Copy each package's package.json individually to preserve structure
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

# Copy other workspace packages if they exist
COPY products/*/package*.json ./products/
COPY services/*/package*.json ./services/

# Clean npm cache and install dependencies
RUN npm cache clean --force
# Install ALL dependencies (we need them for Prisma and build)
# Use --legacy-peer-deps to avoid version conflicts
# Use --ignore-scripts to skip postinstall scripts that require schema files
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy all source code
COPY . .

# Re-run npm install to ensure workspace links are set up correctly after copying source
# Now with source files, postinstall scripts can run properly
RUN npm install --legacy-peer-deps

# Generate Prisma Client in the database package
RUN cd packages/database && npx prisma generate

# Build the skills-orchestrator package
RUN cd packages/skills-orchestrator && npm run build

# Skip build during Docker image creation - will build at runtime
# This avoids Prisma initialization issues during Next.js page collection
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Change to customer-portal directory and start the server
WORKDIR /app/apps/customer-portal

# Generate Prisma client, build Next.js app, and start at runtime
CMD ["sh", "-c", "npx prisma generate --schema=../../packages/database/prisma/schema.prisma && npm run build && npm start"]