#!/bin/bash
# Fix missing SUPABASE_ANON_KEY in VPS .env file

echo "🔧 Adding missing SUPABASE_ANON_KEY to .env file"

# Add the missing SUPABASE_ANON_KEY to the existing .env file
echo "SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoiYW5vbiJ9.w44hBza3fxWqgzNEi6H0T3FSSCPUF8CNtoaoXS8a1I4" >> .env

echo "✅ Updated .env file:"
cat .env

echo ""
echo "🔨 Restarting containers with fixed environment..."
docker compose down
docker compose up -d --build

echo "📊 Container status:"
docker compose ps

echo "📋 Recent logs:"
docker compose logs --tail=10