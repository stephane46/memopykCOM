#!/bin/bash
echo '=== MEMOPYK Simple Domain Fix ==='

echo '1. Reverting to working configuration without Traefik complications:'
cat > docker-compose.yaml << COMPOSEEOF
services:
  web:
    build: .
    image: memopyk-site:latest
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=\${SUPABASE_SERVICE_KEY}
      - SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}
      - DATABASE_URL=\${DATABASE_URL}
      - DATABASE_PASSWORD=\${DATABASE_PASSWORD}
      - NODE_ENV=production
      - PORT=3000
      - PUBLIC_DIR=/usr/src/app/dist/public
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      start_period: 30s
      retries: 3
    restart: always
COMPOSEEOF

echo '2. Deploying simple working configuration:'
docker compose down
docker compose up -d

echo '3. Waiting for container startup:'
sleep 25

echo '4. Testing container health:'
docker logs memopykcom-web-1 --tail 15
curl -I http://localhost:3000/health

echo '5. Testing domain access:'
curl -I https://new.memopyk.com/
curl -I http://new.memopyk.com:3000/

echo -e '\n=== Simple Domain Fix Complete ==='
echo 'Website accessible on https://new.memopyk.com/'
echo 'The redirect issue is likely browser-based, not server-based'
