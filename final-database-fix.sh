#!/bin/bash
echo '=== MEMOPYK Final Database Connection Fix ==='
echo 'Using secure DATABASE_PASSWORD from environment'
echo

# Create .env with correct password from environment variable
echo 'Step 1: Creating .env with secure password...'
cat > .env << EOF
# Environment variables for VPS deployment
# Database password from secure environment variable

# Supabase Configuration (Production values)
SUPABASE_URL=https://supabase.memopyk.org
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.H4YCOnzIUraRH8d54ZB3aEh_kilgoqUnVN9-NboYB6I
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoiYW5vbiJ9.w44hBza3fxWqgzNEi6H0T3FSSCPUF8CNtoaoXS8a1I4

# Application Configuration
NODE_ENV=production
PORT=3000
PUBLIC_DIR=/usr/src/app/dist/public

# Database Configuration (using secure password)
DATABASE_URL=postgresql://postgres:${DATABASE_PASSWORD}@supabase.memopyk.org:5432/postgres
EOF

echo 'Step 2: Restarting container with secure database connection...'
docker compose down
docker compose up -d

echo 'Step 3: Waiting for startup...'
sleep 15

echo 'Step 4: Testing database connection...'
docker compose logs web --tail=20

echo 'Step 5: Testing website and API...'
curl -s http://localhost:3000/api/health | jq '.' || echo 'API test failed'

echo
echo '=== Final Database Connection Test ==='
echo 'If you see database connection success above, the fix is complete!'
echo 'Website: http://localhost:3000'
echo 'Admin: http://localhost:3000/admin'

