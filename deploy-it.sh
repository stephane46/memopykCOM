#!/bin/bash
echo '=== MEMOPYK IT Team Deployment ==='

# Create .env using current environment variables
echo 'Creating .env with current environment variables...'
cat > .env << ENVEOF
# Supabase Configuration
SUPABASE_URL=https://supabase.memopyk.org
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.H4YCOnzIUraRH8d54ZB3aEh_kilgoqUnVN9-NboYB6I
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoiYW5vbiJ9.w44hBza3fxWqgzNEi6H0T3FSSCPUF8CNtoaoXS8a1I4

# Application Configuration
NODE_ENV=production
PORT=3000
PUBLIC_DIR=/usr/src/app/dist/public

# Database Configuration
DATABASE_URL=postgresql://postgres:${DATABASE_PASSWORD}@supabase.memopyk.org:5432/postgres
DATABASE_PASSWORD=${DATABASE_PASSWORD}
ENVEOF

# IT Team deployment sequence
echo 'Running IT team deployment sequence...'
docker compose down
docker compose up -d --build

echo 'Waiting for container startup...'
sleep 10

echo 'Checking for SASL errors...'
docker compose logs web

echo 'Testing health endpoint...'
curl -I http://localhost:3000/health

echo
echo '=== IT Deployment Complete ==='
