# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev libc6-compat

WORKDIR /app

# Copy all package.json files first for better caching
COPY package*.json ./
COPY apps/admin-portal/package*.json ./apps/admin-portal/
COPY apps/customer-portal/package*.json ./apps/customer-portal/
COPY packages/*/package*.json ./packages/
COPY products/*/package*.json ./products/
COPY services/*/package*.json ./services/

# Clean npm cache and install dependencies
RUN npm cache clean --force
# Install ALL dependencies (we need them for Prisma and build)
# Use --legacy-peer-deps to avoid version conflicts
RUN npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Generate Prisma Client in the database package
RUN cd packages/database && npx prisma generate

# Also generate Prisma Client in customer-portal for Next.js
RUN cd apps/customer-portal && npx prisma generate --schema=../../packages/database/prisma/schema.prisma

# Build the customer portal (main user dashboard)
# Set build environment to disable all external service connections
ENV BUILDING=true
ENV NODE_ENV=build
ENV NEXT_PHASE=phase-production-build
RUN cd apps/customer-portal && npm run build
# Reset environment for runtime
ENV BUILDING=false
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Change to customer-portal directory and start the server
WORKDIR /app/apps/customer-portal

# Start the application
CMD ["node", "server.js"]