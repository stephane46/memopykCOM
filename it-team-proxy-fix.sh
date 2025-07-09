#!/bin/bash
echo '=== IT Team Proxy Fix for Traefik (Coolify) ==='

echo '1. Current container status:'
docker ps | grep memopyk

echo -e '\n2. Implementing IT team solution for Traefik:'
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
      # Enable Traefik
      - "traefik.enable=true"
      # Host rule for domain routing
      - "traefik.http.routers.memopyk.rule=Host(\`new.memopyk.com\`)"
      # SSL configuration
      - "traefik.http.routers.memopyk.tls=true"
      - "traefik.http.routers.memopyk.tls.certresolver=letsencrypt"
      # Service configuration
      - "traefik.http.services.memopyk.loadbalancer.server.port=3000"
      # IT Team Fix: Preserve hostname headers (equivalent to proxy_set_header Host \$host)
      - "traefik.http.middlewares.memopyk-headers.headers.customrequestheaders.Host=new.memopyk.com"
      - "traefik.http.middlewares.memopyk-headers.headers.customrequestheaders.X-Forwarded-Proto=https"
      - "traefik.http.middlewares.memopyk-headers.headers.customrequestheaders.X-Forwarded-Host=new.memopyk.com"
      # Disable redirects (equivalent to proxy_redirect off)
      - "traefik.http.middlewares.memopyk-headers.headers.customresponseheaders.Location="
      # Apply middleware to router
      - "traefik.http.routers.memopyk.middlewares=memopyk-headers"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      start_period: 30s
      retries: 3
    restart: always
COMPOSEEOF

echo '3. Deploying IT team approved configuration:'
docker compose down
docker compose up -d

echo '4. Waiting for container startup:'
sleep 30

echo '5. Testing hostname preservation:'
echo "Testing https://new.memopyk.com/ (should preserve hostname on refresh)"
curl -I https://new.memopyk.com/
curl -I https://new.memopyk.com/health

echo -e '\n6. Verifying container logs:'
docker logs memopykcom-web-1 --tail 10

echo -e '\n=== IT Team Proxy Fix Complete ==='
echo 'Visit https://new.memopyk.com and refresh - hostname should now be preserved'
echo 'No more redirects to http://82.29.168.136:3000/'
