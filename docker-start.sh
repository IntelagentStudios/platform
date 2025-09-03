#!/bin/sh
set -e

echo "🚀 Starting Intelagent Platform Customer Portal..."

# Check if we have a build cache
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Found existing Next.js build cache"
    BUILD_ID=$(cat .next/BUILD_ID)
    echo "   Build ID: $BUILD_ID"
    
    # Check if package.json or lock file has changed
    if [ -f ".next/package.json.checksum" ]; then
        CURRENT_CHECKSUM=$(md5sum package.json 2>/dev/null || sha256sum package.json)
        CACHED_CHECKSUM=$(cat .next/package.json.checksum)
        
        if [ "$CURRENT_CHECKSUM" = "$CACHED_CHECKSUM" ]; then
            echo "✅ Build cache is valid, skipping rebuild"
        else
            echo "⚠️  Dependencies have changed, rebuilding..."
            rm -rf .next
        fi
    fi
fi

# Generate Prisma client if needed
if [ ! -d "../../packages/database/node_modules/.prisma/client" ]; then
    echo "📦 Generating Prisma client..."
    npx prisma generate --schema=../../packages/database/prisma/schema.prisma
else
    echo "✅ Prisma client already generated"
fi

# Build Next.js if needed
if [ ! -f ".next/BUILD_ID" ]; then
    echo "🔨 Building Next.js application..."
    npm run build
    
    # Save checksum for cache validation
    if [ -d ".next" ]; then
        md5sum package.json 2>/dev/null > .next/package.json.checksum || \
        sha256sum package.json > .next/package.json.checksum
    fi
else
    echo "✅ Using cached Next.js build"
fi

echo "🌟 Starting production server on port ${PORT:-3000}..."
exec npm start