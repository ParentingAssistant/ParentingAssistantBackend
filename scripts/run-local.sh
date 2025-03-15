#!/bin/bash

# Exit on error
set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with the required environment variables"
    exit 1
fi

# Load environment variables from .env file
source .env

# Build the Docker image
echo "🏗️  Building Docker image..."
docker build -t parenting-assistant-backend:local .

# Run the container with environment variables
echo "🚀 Starting container..."
docker run -it --rm \
    -p 8080:8080 \
    -e NODE_ENV=development \
    -e PORT=8080 \
    -e REDIS_URL="${REDIS_URL}" \
    -e REDIS_HOST="${REDIS_HOST}" \
    -e REDIS_PORT="${REDIS_PORT}" \
    -e REDIS_AUTH_STRING="${REDIS_AUTH_STRING}" \
    -e FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID}" \
    -e FIREBASE_PRIVATE_KEY="${FIREBASE_PRIVATE_KEY}" \
    -e FIREBASE_CLIENT_EMAIL="${FIREBASE_CLIENT_EMAIL}" \
    -e OPENAI_API_KEY="${OPENAI_API_KEY}" \
    -e API_RATE_LIMIT_WINDOW_MS="${API_RATE_LIMIT_WINDOW_MS}" \
    -e API_RATE_LIMIT_MAX_REQUESTS="${API_RATE_LIMIT_MAX_REQUESTS}" \
    -e AI_RATE_LIMIT_WINDOW_MS="${AI_RATE_LIMIT_WINDOW_MS}" \
    -e AI_RATE_LIMIT_MAX_REQUESTS="${AI_RATE_LIMIT_MAX_REQUESTS}" \
    -e CACHE_TTL="${CACHE_TTL}" \
    -e CACHE_NAMESPACE="${CACHE_NAMESPACE}" \
    --name parenting-assistant-local \
    parenting-assistant-backend:local

# Note: The container will be removed after it stops (--rm flag)
# To stop the container, press Ctrl+C 