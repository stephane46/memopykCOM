#!/bin/bash
echo '=== MEMOPYK Coolify Routing Fix ==='

echo '1. Current container status:'
docker ps | grep memopyk

echo -e '\n2. Current Traefik labels:'
docker inspect memopykcom-web-1 | grep -A 20 Labels

echo -e '\n3. Updating docker-compose.yaml with proper Traefik labels:'
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
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.memopyk.rule=Host(\`new.memopyk.com\`)"
      - "traefik.http.routers.memopyk.tls=true"
      - "traefik.http.routers.memopyk.tls.certresolver=letsencrypt"
      - "traefik.http.services.memopyk.loadbalancer.server.port=3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      start_period: 10s
      retries: 3
    restart: always
COMPOSEEOF

echo '4. Redeploying with proper Traefik routing:'
docker compose down
docker compose up -d

echo '5. Waiting for startup and testing:'
sleep 15
curl -I https://new.memopyk.com/health
curl -I https://new.memopyk.com/

echo -e '\n=== Coolify Routing Fix Complete ==='
echo 'Website should now be accessible at: https://new.memopyk.com'
