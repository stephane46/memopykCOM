#!/bin/bash
echo '=== MEMOPYK Database Deploy with Password Prompt ==='

# Prompt for database password securely
read -s -p "Enter your PostgreSQL database password: " DATABASE_PASSWORD
echo

# Validate password was provided
if [ -z "$DATABASE_PASSWORD" ]; then
    echo "ERROR: No password provided"
    exit 1
fi

# Export for use in docker-compose
export DATABASE_PASSWORD

echo 'Step 1: Creating .env with secure password...'
cat > .env << 'ENVEOF'
# Supabase Configuration (Production values)
SUPABASE_URL=https://supabase.memopyk.org
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.H4YCOnzIUraRH8d54ZB3aEh_kilgoqUnVN9-NboYB6I
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTk1ODA2MCwiZXhwIjo0OTA3NjMxNjYwLCJyb2xlIjoiYW5vbiJ9.w44hBza3fxWqgzNEi6H0T3FSSCPUF8CNtoaoXS8a1I4

# Application Configuration
NODE_ENV=production
PORT=3000
PUBLIC_DIR=/usr/src/app/dist/public

# Database Configuration
DATABASE_URL=postgresql://postgres:${DATABASE_PASSWORD}@supabase.memopyk.org:5432/postgres
ENVEOF

# Add the password variable for docker-compose
echo "DATABASE_PASSWORD=\"${DATABASE_PASSWORD}\"" >> .env

echo 'Step 2: Restarting container...'
docker compose down
docker compose up -d

echo 'Step 3: Waiting for startup...'
sleep 15

echo 'Step 4: Checking logs...'
docker compose logs web --tail=15

echo 'Step 5: Testing connection...'
curl -s http://localhost:3000/api/health

echo
echo '=== Deployment Complete ==='
echo 'Check logs above for "DATABASE_PASSWORD validated" message'
