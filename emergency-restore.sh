#!/bin/bash
echo '=== MEMOPYK Emergency Restore ==='

echo '1. Checking container logs:'
docker logs memopykcom-web-1 --tail 50

echo -e '\n2. Testing container health directly:'
docker exec memopykcom-web-1 curl -I http://localhost:3000/health || echo "Container not responding"

echo -e '\n3. Reverting to working docker-compose.yaml:'
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

echo '4. Redeploying with original config:'
docker compose down
docker compose up -d

echo '5. Waiting for proper startup:'
sleep 30
docker logs memopykcom-web-1 --tail 20

echo -e '\n6. Testing all access methods:'
curl -I http://localhost:3000/health
curl -I http://new.memopyk.com:3000/health
curl -I https://new.memopyk.com/health

echo -e '\n=== Emergency Restore Complete ==='
echo 'Container should be working on port 3000'
