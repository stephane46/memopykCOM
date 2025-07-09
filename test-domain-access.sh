#!/bin/bash
echo '=== MEMOPYK Domain Access Test ==='

echo '1. Testing localhost access from VPS:'
curl -I http://localhost:3000/health

echo -e '\n2. Testing new.memopyk.com access:'
curl -I http://new.memopyk.com/health

echo -e '\n3. Testing new.memopyk.com:3000 access:'
curl -I http://new.memopyk.com:3000/health

echo -e '\n4. Checking container port mapping:'
docker ps | grep memopyk

echo -e '\n5. Checking if port 3000 is accessible externally:'
netstat -tulpn | grep :3000

echo -e '\n=== Domain Access Test Complete ==='
