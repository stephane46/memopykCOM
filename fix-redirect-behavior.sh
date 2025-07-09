#!/bin/bash
echo '=== MEMOPYK Redirect Fix ==='

echo '1. Current container status:'
docker ps | grep memopyk

echo -e '\n2. Checking current docker-compose.yaml:'
cat docker-compose.yaml

echo -e '\n3. Updating docker-compose.yaml to fix redirect behavior:'
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
      - "traefik.http.middlewares.memopyk-headers.headers.customrequestheaders.X-Forwarded-Proto=https"
      - "traefik.http.middlewares.memopyk-headers.headers.customrequestheaders.X-Forwarded-Host=new.memopyk.com"
      - "traefik.http.routers.memopyk.middlewares=memopyk-headers"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      start_period: 30s
      retries: 3
    restart: always
COMPOSEEOF

echo '4. Redeploying with redirect fix:'
docker compose down
docker compose up -d

echo '5. Waiting for startup:'
sleep 30

echo -e '\n6. Testing site access:'
curl -I https://new.memopyk.com/
curl -I https://new.memopyk.com/health

echo -e '\n=== Redirect Fix Complete ==='
echo 'Website should stay on new.memopyk.com domain after refresh'
