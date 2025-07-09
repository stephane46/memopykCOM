#!/bin/bash
echo '=== MEMOPYK Manual Fix ==='

# Remove conflicting file
rm -f debug-report.txt

# Get latest code
git pull --ff-only origin main

# Fix database password manually
PASSWORD="8rcP03lp6vM6hbJ6KHyRk7qCjBhRaLjO"

# Create .env with password
cat > .env << ENVEOF
SUPABASE_URL=https://supabase.memopyk.org
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.H4YCOnzIUraRH8d54ZB3aEh_kilgoqUnVN9-NboYB6I
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoiYW5vbiJ9.w44hBza3fxWqgzNEi6H0T3FSSCPUF8CNtoaoXS8a1I4
NODE_ENV=production
PORT=3000
PUBLIC_DIR=/usr/src/app/dist/public
DATABASE_URL=postgresql://postgres:${PASSWORD}@supabase.memopyk.org:5432/postgres
DATABASE_PASSWORD=${PASSWORD}
ENVEOF

echo 'Redeploying...'
docker compose down
docker compose up -d

sleep 10
docker compose logs web --tail=10
