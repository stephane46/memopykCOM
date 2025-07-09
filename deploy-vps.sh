#!/bin/bash
# VPS Deployment Script for MEMOPYK
# This script ensures proper .env setup and deployment

echo "🚀 MEMOPYK VPS Deployment Script"
echo "================================"

# Step 1: Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Step 2: Create .env file from .env.example
echo "📝 Creating .env file from template..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env file created from .env.example"
else
    echo "⚠️  .env file already exists - keeping current version"
fi

# Step 3: Display current environment variables
echo "🔍 Current .env configuration:"
cat .env

# Step 4: Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Step 5: Build and start new containers
echo "🔨 Building and starting containers..."
docker compose up -d --build

# Step 6: Check container status
echo "📊 Container status:"
docker compose ps

# Step 7: Check logs
echo "📋 Recent container logs:"
docker compose logs --tail=20

echo "✅ Deployment complete!"
echo "🌐 Service should be accessible on port 3000"