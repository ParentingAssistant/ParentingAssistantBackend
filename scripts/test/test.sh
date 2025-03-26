#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_URL="https://parenting-assistant-backend-946865924755.us-central1.run.app"
LOCAL_URL="http://localhost:8080"
IMAGE_NAME="parenting-assistant-backend"
IMAGE_TAG="test"
CONTAINER_NAME="parenting-assistant-test"
REDIS_CONTAINER_NAME="parenting-assistant-redis"
PORT=8080
REDIS_PORT=6379

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

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

# Function to make API calls
make_request() {
    local endpoint=$1
    local method=$2
    local data=$3
    local description=$4
    local requires_auth=${5:-false}
    local url=${6:-$SERVICE_URL}

    echo -e "${BLUE}Testing: $description${NC}"
    
    local headers=("-H" "Content-Type: application/json")
    if [ "$requires_auth" = true ] && [ ! -z "$FIREBASE_TOKEN" ]; then
        headers+=("-H" "Authorization: Bearer $FIREBASE_TOKEN")
    fi
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -X GET "${headers[@]}" "$url$endpoint")
    else
        response=$(curl -s -X $method "${headers[@]}" -d "$data" "$url$endpoint")
    fi
    
    echo "Response: $response"
    echo
}

# Main menu
while true; do
    echo -e "${BLUE}=== Parenting Assistant API Test Menu ===${NC}"
    echo "1. Test Local Environment"
    echo "2. Test Production Environment"
    echo "3. Test Deployment"
    echo "4. Exit"
    read -p "Select an option (1-4): " choice
    
    case $choice in
        1)
            print_header "Testing Local Environment"
            
            # Check if .env file exists
            if [ ! -f .env ]; then
                echo -e "${RED}Error: .env file not found${NC}"
                echo "Please create a .env file with the required environment variables"
                continue
            fi
            
            # Load environment variables
            source .env
            
            # Start Redis container
            echo "📦 Starting Redis container..."
            docker run -d \
                --name ${REDIS_CONTAINER_NAME} \
                -p ${REDIS_PORT}:6379 \
                redis:latest
            
            # Build and start application container
            echo "🏗️ Building application container..."
            docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
            
            echo "🚀 Starting application container..."
            docker run -d \
                --name ${CONTAINER_NAME} \
                -p ${PORT}:${PORT} \
                --env-file .env \
                ${IMAGE_NAME}:${IMAGE_TAG}
            
            # Wait for application to start
            echo "⏳ Waiting for application to start..."
            sleep 5
            
            # Test endpoints
            make_request "/health" "GET" "" "Health Check" false $LOCAL_URL
            make_request "/" "GET" "" "Root Endpoint" false $LOCAL_URL
            make_request "/api/meal-plans/generate-meal-plan" "POST" '{"dietaryPreferences":["vegetarian"],"ingredients":["rice","beans"],"daysCount":3,"mealsPerDay":3}' "Generate Meal Plan" true $LOCAL_URL
            make_request "/api/stories/generate-bedtime-story" "POST" '{"childName":"Alex","theme":"adventure","ageGroup":"5-7","storyLength":"medium","includeMoral":true}' "Generate Bedtime Story" true $LOCAL_URL
            ;;
            
        2)
            print_header "Testing Production Environment"
            
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
                    continue
                fi
            fi
            
            # Test endpoints
            make_request "/health" "GET" "" "Health Check"
            make_request "/" "GET" "" "Root Endpoint"
            make_request "/api/meal-plans/generate-meal-plan" "POST" '{"dietaryPreferences":["vegetarian"],"ingredients":["rice","beans"],"daysCount":3,"mealsPerDay":3}' "Generate Meal Plan" true
            make_request "/api/stories/generate-bedtime-story" "POST" '{"childName":"Alex","theme":"adventure","ageGroup":"5-7","storyLength":"medium","includeMoral":true}' "Generate Bedtime Story" true
            ;;
            
        3)
            print_header "Testing Deployment"
            
            # Check if .env file exists
            if [ ! -f .env ]; then
                echo -e "${RED}Error: .env file not found${NC}"
                echo "Please create a .env file with the required environment variables"
                continue
            fi
            
            # Load environment variables
            source .env
            
            # Build and test the application
            echo "🏗️ Building application..."
            npm run build
            
            # Test the build
            echo "🧪 Testing build..."
            npm test
            
            # Deploy to Cloud Run
            echo "🚀 Deploying to Cloud Run..."
            ./scripts/deploy-cloud-run.sh
            
            echo -e "${GREEN}Deployment test completed!${NC}"
            ;;
            
        4)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
            
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
done 