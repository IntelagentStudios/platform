# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
COPY packages/*/package*.json ./packages/
COPY products/*/package*.json ./products/
COPY apps/*/package*.json ./apps/
COPY services/*/package*.json ./services/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma clients for all workspaces
RUN npx turbo run db:generate

# Build all applications
RUN npx turbo run build

# Production stage - Admin Portal
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
COPY packages/*/package*.json ./packages/
COPY products/*/package*.json ./products/
COPY apps/*/package*.json ./apps/
COPY services/*/package*.json ./services/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built applications and necessary files
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/products ./products
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/services ./services
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schemas
COPY packages/database/prisma ./packages/database/prisma
COPY apps/admin-portal/prisma ./apps/admin-portal/prisma
COPY apps/customer-portal/prisma ./apps/customer-portal/prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the admin portal by default
CMD ["node", "apps/admin-portal/server.js"]