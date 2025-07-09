#!/bin/bash
echo '=== MEMOPYK Container Debug Report ==='
echo 'Generated at:' $(date)
echo

echo '=== Container Status ==='
docker compose ps

echo
echo '=== Container Logs (last 30 lines) ==='
docker compose logs web --tail=30

echo
echo '=== Container Process Check ==='
docker compose exec web ps aux || echo 'Cannot connect to container'

echo
echo '=== Port and Network Check ==='
docker compose exec web netstat -tlnp || echo 'netstat not available'
docker compose exec web ss -tlnp || echo 'ss not available'

echo
echo '=== Environment Variables ==='
docker compose exec web env | grep -E '(DATABASE_URL|NODE_ENV|PORT|PUBLIC_DIR)' || echo 'Cannot access environment'

echo
echo '=== File System Check ==='
docker compose exec web ls -la /usr/src/app/ || echo 'Cannot access filesystem'
docker compose exec web ls -la /usr/src/app/dist/ || echo 'dist directory check failed'

echo
echo '=== Health Check Manual Test ==='
docker compose exec web curl -i http://localhost:3000/health || echo 'Internal health check failed'

echo
echo '=== End Debug Report ==='

