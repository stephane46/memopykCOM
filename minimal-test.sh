#!/bin/bash
echo '=== MINIMAL CONTAINER TEST ==='

# Start fresh
docker compose down
sleep 2

# Build and start
echo 'Building container...'
docker compose up -d --build

# Wait for startup
echo 'Waiting 10 seconds for startup...'
sleep 10

# Check container status
echo 'Container status:'
docker compose ps

echo 
echo 'Container logs:'
docker compose logs web

echo
echo 'Testing connections:'
timeout 5 curl -v http://localhost:3000/health || echo 'Health check failed'
timeout 5 curl -v http://localhost:3000/ || echo 'Root path failed'

echo
echo 'Container process check:'
docker compose exec web ps aux 2>/dev/null || echo 'Cannot exec into container'

