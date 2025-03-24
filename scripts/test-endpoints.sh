#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service URL
SERVICE_URL="https://parenting-assistant-backend-946865924755.us-central1.run.app"

# Check for Firebase token
if [ -z "$FIREBASE_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Warning: No Firebase token provided. Protected endpoints will fail.${NC}"
    echo -e "${BLUE}To run authenticated tests:${NC}"
    echo "1. Get a valid Firebase ID token"
    echo "2. Export it: export FIREBASE_TOKEN='your-token-here'"
    echo "3. Run this script again"
    
    read -p "Do you want to continue without authentication? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Test canceled.${NC}"
        exit 1
    fi
fi

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== Testing $1 ===${NC}\n"
}

# Function to make API calls
make_request() {
    local endpoint=$1
    local method=$2
    local data=$3
    local description=$4
    local requires_auth=${5:-false}

    echo -e "${BLUE}Testing: $description${NC}"
    
    local headers=("-H" "Content-Type: application/json")
    if [ "$requires_auth" = true ] && [ ! -z "$FIREBASE_TOKEN" ]; then
        headers+=("-H" "Authorization: Bearer $FIREBASE_TOKEN")
    fi
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -X GET "${headers[@]}" "$SERVICE_URL$endpoint")
    else
        response=$(curl -s -X $method "${headers[@]}" "$SERVICE_URL$endpoint" -d "$data")
    fi

    # Check if the response is valid JSON
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}Response:${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}Response:${NC}"
        echo "$response"
    fi
    echo "----------------------------------------"
}

# Test health endpoint
print_header "Health Endpoint"
make_request "/health" "GET" "" "Health check endpoint"

# Test root endpoint
print_header "Root Endpoint"
make_request "/" "GET" "" "Root endpoint"

# Test meal plans endpoint
print_header "Meal Plans Endpoint"
make_request "/api/meal-plans/generate-meal-plan" "POST" '{
    "dietaryPreferences": ["vegetarian"],
    "ingredients": ["quinoa", "chickpeas"],
    "daysCount": 1,
    "mealsPerDay": 2
}' "Generate meal plan" true

# Test stories endpoint
print_header "Stories Endpoint"
make_request "/api/stories/generate-bedtime-story" "POST" '{
    "childName": "Alex",
    "theme": "friendship",
    "ageGroup": "5-7",
    "storyLength": "short",
    "includesMorals": true
}' "Generate story" true

# Test inference endpoint
print_header "Inference Endpoint"
make_request "/api/inference" "POST" '{
    "provider": "openai",
    "prompt": "Generate a parenting tip about managing screen time for children",
    "temperature": 0.7
}' "Generate parenting tip" true

echo -e "\n${GREEN}All endpoint tests completed!${NC}" 