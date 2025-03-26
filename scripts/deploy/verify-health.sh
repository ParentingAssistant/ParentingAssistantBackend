#!/bin/bash

# Exit on error
set -e

# Configuration
MAX_RETRIES=30
RETRY_INTERVAL=2
HEALTH_CHECK_URL="http://localhost:8080/health"

# Function to check container logs
check_logs() {
    echo "📋 Checking container logs..."
    docker logs parenting-assistant-local 2>&1 | grep -i "error\|failed\|❌"
    if [ $? -eq 0 ]; then
        echo "❌ Found errors in container logs"
        return 1
    else
        echo "✅ No errors found in logs"
        return 0
    fi
}

# Function to check health endpoint
check_health() {
    echo "🏥 Checking health endpoint..."
    response=$(curl -s -w "\n%{http_code}" $HEALTH_CHECK_URL)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n1)
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ Health check passed"
        echo "Response: $body"
        return 0
    else
        echo "❌ Health check failed with status $http_code"
        echo "Response: $body"
        return 1
    fi
}

# Main verification loop
echo "🔍 Starting health verification..."
echo "Waiting for container to start..."

for i in $(seq 1 $MAX_RETRIES); do
    if check_health; then
        if check_logs; then
            echo "✨ Container is healthy and running properly!"
            echo "📝 Container Details:"
            echo "- Health Check URL: $HEALTH_CHECK_URL"
            echo "- Container Name: parenting-assistant-local"
            echo "- Port Mapping: 8080:8080"
            exit 0
        fi
    fi
    
    echo "Attempt $i/$MAX_RETRIES - Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
done

echo "❌ Container failed to become healthy within timeout period"
echo "Dumping full container logs:"
docker logs parenting-assistant-local
exit 1 