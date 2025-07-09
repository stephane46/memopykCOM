#!/bin/bash
echo '=== MEMOPYK Database Password Fix ==='

# The actual password from Replit secrets
PASSWORD="8rcP03lp6vJnzJhXVFe8g4RGRayJrwGqUNJGnKfJrEzSJqhLnQZhJqSGZE"

# Create proper .env file
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
DATABASE_URL=postgresql://postgres:${PASSWORD}@supabase.memopyk.org:5432/postgres
DATABASE_PASSWORD=${PASSWORD}
ENVEOF

echo 'Fixed .env file created'
echo 'Redeploying container...'
docker compose down
docker compose up -d

echo 'Testing database connection...'
sleep 10
docker compose logs web --tail=10
curl -I http://localhost:3000/health

echo '=== Fix Complete ==='
