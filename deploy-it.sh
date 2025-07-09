#!/bin/bash

# MEMOPYK Production Deployment Script
# This is the one-click deployment script referenced by IT

set -e

echo "🚀 MEMOPYK Production Deployment Starting..."
echo "📍 Working directory: $(pwd)"

# Ensure we're in the right directory
if [ ! -f "docker-compose.yaml" ]; then
    echo "❌ Error: docker-compose.yaml not found. Are you in the right directory?"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Are you in the right directory?"
    exit 1
fi

# Set up environment if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
DATABASE_PASSWORD=8rcP03lp6vxrzCeeW1tkJCKa5yHSm04Y
DATABASE_URL=postgresql://postgres:8rcP03lp6vxrzCeeW1tkJCKa5yHSm04Y@supabase.memopyk.org:5432/postgres
SUPABASE_URL=https://supabase.memopyk.org
SUPABASE_SERVICE_KEY=dummy
SUPABASE_ANON_KEY=dummy
NODE_ENV=production
PORT=3000
PUBLIC_DIR=/usr/src/app/dist/public
EOF
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down || echo "No containers to stop"

# Clean up old images and containers
echo "🧹 Cleaning up..."
docker system prune -f

# Build and start containers
echo "🏗️ Building and starting containers..."
docker compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Check container status
echo "📊 Container status:"
docker compose ps

# Health check
echo "🏥 Performing health check..."
for i in {1..10}; do
    if curl -f -s http://localhost:3000/health > /dev/null; then
        echo "✅ Health check passed!"
        break
    else
        echo "⏳ Attempt $i/10 - waiting for service..."
        sleep 3
    fi
done

# Final status
echo ""
echo "🎉 Deployment completed!"
echo "🌐 Service should be available at:"
echo "   - http://localhost:3000"
echo "   - https://new.memopyk.com"
echo ""
echo "📊 Final container status:"
docker compose ps