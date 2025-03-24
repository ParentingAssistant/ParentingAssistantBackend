#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVICE_URL="https://parenting-assistant-backend-946865924755.us-central1.run.app"

# Check if a service account key file exists
if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage:${NC} ./test-production.sh /path/to/service-account-key.json"
  echo -e "You need a valid service account key file from the production Firebase project."
  exit 1
fi

SERVICE_ACCOUNT_KEY="$1"

# Check if the service account key file exists
if [ ! -f "$SERVICE_ACCOUNT_KEY" ]; then
  echo -e "${RED}Error:${NC} Service account key file not found: $SERVICE_ACCOUNT_KEY"
  exit 1
fi

# Generate a Firebase token
echo -e "${BLUE}Generating Firebase token...${NC}"
TOKEN=$(node -e "
const admin = require('firebase-admin');
const serviceAccount = require('$SERVICE_ACCOUNT_KEY');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.auth().createCustomToken('test-user').then(token => { console.log(token); process.exit(0); });
")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Error:${NC} Failed to generate Firebase token"
  exit 1
fi

echo -e "${GREEN}Token generated successfully!${NC}"

# Test the health endpoint
echo -e "\n${BLUE}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/health")
echo "Response: $HEALTH_RESPONSE"

# Test the root endpoint
echo -e "\n${BLUE}Testing root endpoint...${NC}"
ROOT_RESPONSE=$(curl -s "$SERVICE_URL/")
echo "Response: $ROOT_RESPONSE"

# Test the meal plans endpoint
echo -e "\n${BLUE}Testing meal plans endpoint...${NC}"
MEAL_PLAN_DATA='{"dietaryPreferences": ["vegetarian"], "ingredients": ["quinoa", "chickpeas"], "daysCount": 1, "mealsPerDay": 2}'
MEAL_PLAN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$MEAL_PLAN_DATA" "$SERVICE_URL/api/meal-plans/generate-meal-plan")
echo "Response: $MEAL_PLAN_RESPONSE"

# Test the stories endpoint
echo -e "\n${BLUE}Testing stories endpoint...${NC}"
STORY_DATA='{"childName": "Emma", "theme": "space adventure", "ageGroup": "5-8", "storyLength": "short", "includesMorals": true}'
STORY_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$STORY_DATA" "$SERVICE_URL/api/stories/generate-bedtime-story")
echo "Response: $STORY_RESPONSE"

# Test the inference endpoint
echo -e "\n${BLUE}Testing inference endpoint...${NC}"
INFERENCE_DATA='{"provider": "openai", "prompt": "Write a short parenting tip.", "temperature": 0.7}'
INFERENCE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$INFERENCE_DATA" "$SERVICE_URL/api/inference")
echo "Response: $INFERENCE_RESPONSE"

echo -e "\n${GREEN}Testing complete!${NC}" 