# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install dependencies for node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy all package.json files first for better caching
COPY package*.json ./
COPY apps/admin-portal/package*.json ./apps/admin-portal/
COPY apps/customer-portal/package*.json ./apps/customer-portal/
COPY packages/*/package*.json ./packages/
COPY products/*/package*.json ./products/
COPY services/*/package*.json ./services/

# Install ALL dependencies (we need them for Prisma and build)
RUN npm ci

# Copy all source code
COPY . .

# Generate Prisma Client
RUN cd apps/admin-portal && npx prisma generate

# Build the admin portal
RUN cd apps/admin-portal && npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Change to admin-portal directory and start the server
WORKDIR /app/apps/admin-portal

# Start the application
CMD ["node", "server.js"]