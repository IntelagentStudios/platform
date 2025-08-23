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

# Install ALL dependencies (we need them for Prisma and build)
# Use --ignore-scripts to prevent postinstall scripts from running before files are copied
RUN npm ci --ignore-scripts

# Copy all source code
COPY . .

# Set Prisma binary targets for Alpine Linux
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node
ENV PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query-engine-linux-musl-openssl-3.0.x
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=library

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