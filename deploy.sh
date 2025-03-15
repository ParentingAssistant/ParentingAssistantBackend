#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT}
REGION="us-central1"  # Default region
SERVICE_NAME="parenting-assistant-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Check if required environment variables are set
if [ -z "$PROJECT_ID" ]; then
    echo "Error: GOOGLE_CLOUD_PROJECT environment variable is not set"
    exit 1
fi

echo "🔄 Starting deployment process..."

# Ensure gcloud is configured with the correct project
echo "🔧 Configuring Google Cloud project..."
gcloud config set project ${PROJECT_ID}

# Build the Docker image
echo "🏗️ Building Docker image..."
docker build -t ${IMAGE_NAME} .

# Push the image to Container Registry
echo "⬆️ Pushing image to Container Registry..."
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "PORT=3000" \
    --set-env-vars "REDIS_URL=${REDIS_URL}" \
    --set-env-vars "REDIS_HOST=${REDIS_HOST}" \
    --set-env-vars "REDIS_PORT=${REDIS_PORT}" \
    --set-env-vars "REDIS_AUTH_STRING=${REDIS_AUTH_STRING}" \
    --set-env-vars "FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}" \
    --set-env-vars "FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}" \
    --set-env-vars "FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}" \
    --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
    --set-env-vars "API_RATE_LIMIT_WINDOW_MS=${API_RATE_LIMIT_WINDOW_MS}" \
    --set-env-vars "API_RATE_LIMIT_MAX_REQUESTS=${API_RATE_LIMIT_MAX_REQUESTS}" \
    --set-env-vars "AI_RATE_LIMIT_WINDOW_MS=${AI_RATE_LIMIT_WINDOW_MS}" \
    --set-env-vars "AI_RATE_LIMIT_MAX_REQUESTS=${AI_RATE_LIMIT_MAX_REQUESTS}" \
    --set-env-vars "CACHE_TTL=${CACHE_TTL}" \
    --set-env-vars "CACHE_NAMESPACE=${CACHE_NAMESPACE}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)')

echo "✅ Deployment complete!"
echo "🌎 Service URL: ${SERVICE_URL}" 