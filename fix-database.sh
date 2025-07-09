#!/bin/bash
echo '=== MEMOPYK Production Database Fix ==='
echo 'Updating database connection from IP:5433 to domain:5432'
echo

# Update environment file  
echo 'Step 1: Updating .env file...'
cp .env.example .env

echo 'Step 2: Restarting container with new database URL...'
docker compose down
docker compose up -d

echo 'Step 3: Testing database connection...'
sleep 10

echo 'Step 4: Checking server logs...'
docker compose logs web --tail=10

echo 'Step 5: Testing website functionality...'
curl -i http://localhost:3000/api/health

echo
echo '=== Database Fix Complete ==='
echo 'New DATABASE_URL: supabase.memopyk.org:5432'
echo 'Previous DATABASE_URL: 82.29.168.136:5433 (connection refused)'

