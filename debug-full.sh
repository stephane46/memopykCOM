#!/bin/bash
echo '=== Container Status ==='
docker compose ps

echo -e '\n=== Latest Container Logs ==='
docker compose logs web --tail=20

echo -e '\n=== Container Environment Check ==='
docker compose exec web env | grep -E '(DATABASE_URL|NODE_ENV|PORT|PUBLIC_DIR)'

echo -e '\n=== Test Database Connection ==='
docker compose exec web node -e "
console.log('Testing database connection...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...');
"

