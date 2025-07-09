#!/bin/bash
cd /opt/memopykCOM
echo '=== Checking container logs ==='
docker compose logs -f web --tail=50

