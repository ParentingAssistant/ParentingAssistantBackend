#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=3
RETRY_INTERVAL=5
TIMEOUT=10

# Default values
SERVICE_URL=${SERVICE_URL:-"https://parenting-assistant-backend-h5engjskkq-uc.a.run.app"}
FIREBASE_TOKEN=${FIREBASE_TOKEN:-""}

# Function to show help
show_help() {
    echo -e "${BLUE}Parenting Assistant Backend API Test Script${NC}"
    echo -e "This script tests the API endpoints of the Parenting Assistant Backend service."
    echo
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ./$(basename "$0") [options]"
    echo
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  -h, --help                 Show this help message"
    echo -e "  -u, --url URL              Set the service URL (default: $SERVICE_URL)"
    echo -e "  -t, --token TOKEN          Set the Firebase token for authentication"
    echo -e "  -s, --skip-auth            Skip authentication check prompt"
    echo
    echo -e "${YELLOW}Environment Variables:${NC}"
    echo -e "  SERVICE_URL                Service URL (overridden by --url)"
    echo -e "  FIREBASE_TOKEN             Firebase token (overridden by --token)"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  ./$(basename "$0") --url http://localhost:8080"
    echo -e "  ./$(basename "$0") --token \"your-firebase-token\""
    echo -e "  SERVICE_URL=http://localhost:8080 FIREBASE_TOKEN=\"token\" ./$(basename "$0")"
    echo
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -u|--url)
                SERVICE_URL="$2"
                shift 2
                ;;
            -t|--token)
                FIREBASE_TOKEN="$2"
                shift 2
                ;;
            -s|--skip-auth)
                SKIP_AUTH_CHECK=true
                shift
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# Function to print with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check required environment variables
check_requirements() {
    if [ -z "$FIREBASE_TOKEN" ] && [ "$SKIP_AUTH_CHECK" != "true" ]; then
        log "${YELLOW}⚠ Warning: No Firebase token provided. Authenticated tests will fail.${NC}"
        log "${BLUE}To run authenticated tests:${NC}"
        log "1. Get a valid Firebase ID token"
        log "2. Export it: export FIREBASE_TOKEN='your-token-here'"
        log "3. Run this script again"
        
        read -p "Do you want to continue without authentication? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "${RED}Test canceled.${NC}"
            exit 1
        fi
    fi

    log "${GREEN}✓ Service URL:${NC} $SERVICE_URL"
    if [ ! -z "$FIREBASE_TOKEN" ]; then
        log "${GREEN}✓ Firebase token:${NC} [Provided]"
    fi
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
    
    # Test 5: Inference with OpenAI
    ((total_tests++))
    local inference_openai_data='{
        "provider": "openai",
        "prompt": "Write a one-sentence parenting tip.",
        "temperature": 0.7
    }'
    if ! make_request "/api/inference" "POST" "$inference_openai_data" "Inference with OpenAI"; then
        ((failed_tests++))
    fi
    
    # Test 6: Inference with HuggingFace
    ((total_tests++))
    local inference_huggingface_data='{
        "provider": "huggingface",
        "prompt": "Write a one-sentence parenting tip.",
        "model": "mistralai/Mistral-7B-Instruct-v0.2"
    }'
    if ! make_request "/api/inference" "POST" "$inference_huggingface_data" "Inference with HuggingFace"; then
        ((failed_tests++))
    fi
    
    # Test 7: Inference with TogetherAI
    ((total_tests++))
    local inference_togetherai_data='{
        "provider": "togetherai",
        "prompt": "Write a one-sentence parenting tip.",
        "temperature": 0.7,
        "maxTokens": 50
    }'
    if ! make_request "/api/inference" "POST" "$inference_togetherai_data" "Inference with TogetherAI"; then
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

# Parse command line arguments
parse_args "$@"

# Check requirements before running tests
check_requirements

# Execute main function
main 