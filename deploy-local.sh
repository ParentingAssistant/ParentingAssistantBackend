#!/bin/bash

# Exit on error
set -e

# Configuration
SERVICE_NAME="parenting-assistant-backend"
REGION="us-central1"
PROJECT_ID="${FIREBASE_PROJECT_ID:-your-gcp-project-id}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found. Please create one with the required environment variables."
  exit 1
fi

# Load environment variables from .env file
source .env

# Check required environment variables
MISSING=""
[ -z "$FIREBASE_PRIVATE_KEY" ] && MISSING="$MISSING FIREBASE_PRIVATE_KEY"
[ -z "$FIREBASE_PROJECT_ID" ] && MISSING="$MISSING FIREBASE_PROJECT_ID"
[ -z "$FIREBASE_CLIENT_EMAIL" ] && MISSING="$MISSING FIREBASE_CLIENT_EMAIL"
[ -z "$OPENAI_API_KEY" ] && MISSING="$MISSING OPENAI_API_KEY"

if [ ! -z "$MISSING" ]; then
  echo "❌ Error: Missing required environment variables:$MISSING"
  exit 1
fi

echo "✅ All required environment variables are set."

# Create a temporary deployment.yaml file
echo "📝 Creating temporary deployment.yaml file..."
cat << EOF > deployment.yaml
NODE_ENV: "production"
REDIS_URL: "${REDIS_URL}"
REDIS_HOST: "${REDIS_HOST}"
REDIS_PORT: "${REDIS_PORT}"
REDIS_AUTH_STRING: "${REDIS_AUTH_STRING}"
FIREBASE_PROJECT_ID: "${FIREBASE_PROJECT_ID}"
FIREBASE_CLIENT_EMAIL: "${FIREBASE_CLIENT_EMAIL}"
OPENAI_API_KEY: "${OPENAI_API_KEY}"
API_RATE_LIMIT_WINDOW_MS: "60000"
API_RATE_LIMIT_MAX_REQUESTS: "100"
AI_RATE_LIMIT_WINDOW_MS: "3600000"
AI_RATE_LIMIT_MAX_REQUESTS: "50"
CACHE_TTL: "3600"
CACHE_NAMESPACE: "parenting-assistant"
FIREBASE_PRIVATE_KEY: |
$(echo "$FIREBASE_PRIVATE_KEY" | sed 's/^/  /')
EOF

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --region ${REGION} \
  --env-vars-file deployment.yaml \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --platform=managed \
  --timeout=300 \
  --port=8080 \
  --no-use-http2 \
  --cpu-boost

# Clean up the temporary deployment.yaml file
echo "🧹 Cleaning up temporary files..."
rm deployment.yaml

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)')" 