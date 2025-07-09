#!/bin/bash
echo '=== Fix Database Password ==='

# The actual password from Replit secrets
PASSWORD="8rcP03lp6vM6hbJ6KHyRk7qCjBhRaLjO"

# Add DATABASE_PASSWORD to .env file
echo "DATABASE_PASSWORD=$PASSWORD" >> .env

# Also update the DATABASE_URL to include the password
sed -i "s|postgresql://postgres:@|postgresql://postgres:$PASSWORD@|g" .env

echo 'Password added to .env file'
echo 'Restarting container...'
docker compose down
docker compose up -d

sleep 10
echo 'Checking database connection...'
docker compose logs web --tail=10
