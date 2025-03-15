#!/bin/bash

# Exit on error
set -e

# Function to cleanup containers and logs
cleanup() {
    echo "🧹 Cleaning up..."
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Stopping application container..."
        docker stop ${CONTAINER_NAME} >/dev/null 2>&1 || true
    fi
    if docker ps -a --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER_NAME}$"; then
        echo "Stopping Redis container..."
        docker stop ${REDIS_CONTAINER_NAME} >/dev/null 2>&1 || true
    fi
    if [ ! -z "$LOGS_PID" ]; then
        kill $LOGS_PID 2>/dev/null || true
    fi
}

# Set up trap for cleanup
trap cleanup EXIT

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with the required environment variables"
    exit 1
fi

# Load environment variables
source .env

# Configuration
IMAGE_NAME="parenting-assistant-backend"
IMAGE_TAG="test"
CONTAINER_NAME="parenting-assistant-test"
REDIS_CONTAINER_NAME="parenting-assistant-redis"
PORT=8080
REDIS_PORT=6379

echo "🔍 Starting deployment test..."
echo "----------------------------------------"

# Step 1: Start Redis container
echo "📦 Starting Redis container..."
docker run -d \
    --name ${REDIS_CONTAINER_NAME} \
    -p ${REDIS_PORT}:6379 \
    redis:7-alpine || {
    echo "❌ Failed to start Redis container"
    exit 1
}

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
sleep 2

# Step 2: Build the image
echo "🏗️  Building Docker image..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} . || {
    echo "❌ Docker build failed"
    exit 1
}

# Step 3: Ensure no existing container
echo "🧹 Cleaning up any existing containers..."
docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1 || true

# Step 4: Run the container with all environment variables
echo "🚀 Starting container..."
if ! docker run -d \
    --name ${CONTAINER_NAME} \
    --link ${REDIS_CONTAINER_NAME}:redis \
    -p ${PORT}:${PORT} \
    -e NODE_ENV=production \
    -e PORT=${PORT} \
    -e REDIS_URL="redis://redis:6379" \
    -e REDIS_HOST="redis" \
    -e REDIS_PORT="6379" \
    -e REDIS_AUTH_STRING="${REDIS_AUTH_STRING}" \
    -e FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID}" \
    -e FIREBASE_PRIVATE_KEY="${FIREBASE_PRIVATE_KEY}" \
    -e FIREBASE_CLIENT_EMAIL="${FIREBASE_CLIENT_EMAIL}" \
    -e OPENAI_API_KEY="${OPENAI_API_KEY}" \
    -e API_RATE_LIMIT_WINDOW_MS="${API_RATE_LIMIT_WINDOW_MS:-60000}" \
    -e API_RATE_LIMIT_MAX_REQUESTS="${API_RATE_LIMIT_MAX_REQUESTS:-100}" \
    -e AI_RATE_LIMIT_WINDOW_MS="${AI_RATE_LIMIT_WINDOW_MS:-60000}" \
    -e AI_RATE_LIMIT_MAX_REQUESTS="${AI_RATE_LIMIT_MAX_REQUESTS:-50}" \
    -e CACHE_TTL="${CACHE_TTL:-3600}" \
    -e CACHE_NAMESPACE="${CACHE_NAMESPACE:-parenting-assistant}" \
    ${IMAGE_NAME}:${IMAGE_TAG}; then
    
    echo "❌ Failed to start container"
    exit 1
fi

# Step 5: Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 2

# Step 6: Check if container is still running
if ! docker ps | grep -q ${CONTAINER_NAME}; then
    echo "❌ Container failed to start. Checking logs:"
    docker logs ${CONTAINER_NAME} || echo "No logs available"
    exit 1
fi

# Step 7: Monitor container startup
echo "📋 Checking container logs..."
docker logs -f ${CONTAINER_NAME} &
LOGS_PID=$!

# Step 8: Test health endpoint
echo "🏥 Testing health endpoint..."
MAX_RETRIES=30
RETRY_INTERVAL=2
HEALTH_URL="http://localhost:${PORT}/health"

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i/$MAX_RETRIES..."
    
    # Check if container is still running
    if ! docker ps | grep -q ${CONTAINER_NAME}; then
        echo "❌ Container stopped unexpectedly. Last logs:"
        docker logs ${CONTAINER_NAME} || echo "No logs available"
        exit 1
    fi
    
    if curl -s -f ${HEALTH_URL} > /dev/null 2>&1; then
        kill $LOGS_PID 2>/dev/null || true
        echo "✅ Health check passed!"
        echo "🌐 Service is running at http://localhost:${PORT}"
        echo "----------------------------------------"
        echo "🔍 Testing endpoints:"
        echo "- Health check: ${HEALTH_URL}"
        echo "- API endpoint: http://localhost:${PORT}/api"
        echo ""
        echo "📝 Container logs are available with:"
        echo "docker logs ${CONTAINER_NAME}"
        echo ""
        echo "🛑 To stop the containers:"
        echo "docker stop ${CONTAINER_NAME} ${REDIS_CONTAINER_NAME}"
        exit 0
    fi
    
    sleep $RETRY_INTERVAL
done

# If we get here, the health check failed
kill $LOGS_PID 2>/dev/null || true
echo "❌ Container failed to become healthy within timeout period"
echo "📋 Full container logs:"
docker logs ${CONTAINER_NAME} || echo "No logs available"
exit 1 