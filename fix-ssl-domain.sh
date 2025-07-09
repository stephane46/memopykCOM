#!/bin/bash
echo '=== MEMOPYK SSL Domain Access Fix ==='

echo '1. Testing current domain access:'
curl -I https://new.memopyk.com/health || echo "HTTPS failed"
curl -I http://new.memopyk.com/health || echo "HTTP failed"
curl -I http://new.memopyk.com:3000/health || echo "Port 3000 failed"

echo -e '\n2. Checking nginx configuration:'
nginx -t || echo "Nginx config error"

echo -e '\n3. Checking SSL certificates:'
ls -la /etc/letsencrypt/live/new.memopyk.com/ || echo "SSL certs missing"

echo -e '\n4. Setting up nginx reverse proxy for new.memopyk.com:'
cat > /etc/nginx/sites-available/new.memopyk.com << NGINXEOF
server {
    listen 80;
    server_name new.memopyk.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name new.memopyk.com;
    
    ssl_certificate /etc/letsencrypt/live/new.memopyk.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/new.memopyk.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

echo '5. Enabling site and reloading nginx:'
ln -sf /etc/nginx/sites-available/new.memopyk.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo -e '\n6. Testing SSL domain access:'
sleep 5
curl -I https://new.memopyk.com/health
curl -I https://new.memopyk.com/

echo -e '\n=== SSL Domain Fix Complete ==='
echo 'Website should now be accessible at: https://new.memopyk.com'
