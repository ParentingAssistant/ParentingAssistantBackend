#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=3
RETRY_INTERVAL=5
TIMEOUT=10

# Default values
SERVICE_URL=${SERVICE_URL:-"https://parenting-assistant-backend-h5engjskkq-uc.a.run.app"}
FIREBASE_TOKEN=${FIREBASE_TOKEN:-""}

# Function to print with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to make HTTP requests with retry logic
make_request() {
    local endpoint=$1
    local method=${2:-"GET"}
    local data=${3:-""}
    local description=$4
    local success=false

    log "${YELLOW}Testing: ${description}${NC}"
    
    for i in $(seq 1 $MAX_RETRIES); do
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" \
                -H "Authorization: Bearer $FIREBASE_TOKEN" \
                -H "Content-Type: application/json" \
                -m $TIMEOUT \
                "${SERVICE_URL}${endpoint}")
        else
            response=$(curl -s -w "\n%{http_code}" \
                -X $method \
                -H "Authorization: Bearer $FIREBASE_TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data" \
                -m $TIMEOUT \
                "${SERVICE_URL}${endpoint}")
        fi

        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" = "200" ]; then
            log "${GREEN}✓ Success: ${description}${NC}"
            log "Response: $body"
            success=true
            break
        else
            if [ $i -lt $MAX_RETRIES ]; then
                log "${YELLOW}⚠ Attempt $i failed with status $http_code. Retrying in ${RETRY_INTERVAL}s...${NC}"
                sleep $RETRY_INTERVAL
            else
                log "${RED}✗ Failed: ${description}${NC}"
                log "Status Code: $http_code"
                log "Response: $body"
            fi
        fi
    done

    if [ "$success" = false ]; then
        return 1
    fi
    return 0
}

# Main test execution
main() {
    local failed_tests=0
    local total_tests=0

    log "${YELLOW}Starting API endpoint tests...${NC}"
    log "Service URL: $SERVICE_URL"

    # Test 1: Health Check
    ((total_tests++))
    if ! make_request "/health" "GET" "" "Health Check Endpoint"; then
        ((failed_tests++))
    fi

    # Test 2: Root Endpoint
    ((total_tests++))
    if ! make_request "/" "GET" "" "Root Endpoint"; then
        ((failed_tests++))
    fi

    # Test 3: Generate Meal Plan
    ((total_tests++))
    local meal_plan_data='{
        "dietaryPreferences": ["vegetarian"],
        "ingredients": ["quinoa", "chickpeas"],
        "daysCount": 1,
        "mealsPerDay": 2
    }'
    if ! make_request "/api/meal-plans/generate-meal-plan" "POST" "$meal_plan_data" "Generate Meal Plan"; then
        ((failed_tests++))
    fi

    # Test 4: Generate Bedtime Story
    ((total_tests++))
    local story_data='{
        "childName": "Emma",
        "theme": "space adventure",
        "ageGroup": "5-8",
        "storyLength": "short",
        "includesMorals": true
    }'
    if ! make_request "/api/stories/generate-bedtime-story" "POST" "$story_data" "Generate Bedtime Story"; then
        ((failed_tests++))
    fi

    # Summary
    log "\n${YELLOW}Test Summary:${NC}"
    log "Total Tests: $total_tests"
    log "Passed: $((total_tests - failed_tests))"
    log "Failed: $failed_tests"

    if [ $failed_tests -eq 0 ]; then
        log "${GREEN}✓ All tests passed successfully!${NC}"
        exit 0
    else
        log "${RED}✗ Some tests failed. Please check the logs above.${NC}"
        exit 1
    fi
}

# Check if Firebase token is provided
if [ -z "$FIREBASE_TOKEN" ]; then
    log "${YELLOW}⚠ Warning: No Firebase token provided. Some tests may fail.${NC}"
    log "Set the FIREBASE_TOKEN environment variable to run authenticated tests."
fi

# Execute main function
main 