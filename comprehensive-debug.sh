#!/bin/bash
echo '=== COMPREHENSIVE DEBUG REPORT ==='

echo '1. Show .env file content:'
echo 'DATABASE_PASSWORD in .env:'
if [ -f .env ]; then
    grep "DATABASE_PASSWORD" .env || echo "❌ DATABASE_PASSWORD not found in .env"
else
    echo "❌ .env file not found"
fi

echo
echo '2. Test container environment:'
echo 'Container environment variables:'
docker exec memopykcom-web-1 printenv | grep -E "(DATABASE|SUPABASE)" | head -10

echo
echo '3. Container logs (last 20 lines):'
docker compose logs web --tail=20

echo
echo '4. Database connection test:'
docker exec memopykcom-web-1 sh -c 'echo "DATABASE_PASSWORD length: ${#DATABASE_PASSWORD}"'

echo
echo '5. Manual password test:'
echo 'If DATABASE_PASSWORD is empty, we need to set it manually'
echo 'Expected: DATABASE_PASSWORD=8rcP03lp6v... (from Replit secrets)'

echo
echo '=== DEBUG COMPLETE ==='
