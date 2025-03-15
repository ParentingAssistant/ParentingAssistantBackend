#!/bin/sh

# Function to check if a variable is set
check_var() {
    eval val=\$$1
    if [ -z "$val" ]; then
        echo "❌ Error: $1 is not set"
        return 1
    fi
    return 0
}

# Function to check Firebase credentials
check_firebase_creds() {
    echo "🔑 Checking Firebase credentials..."
    
    # Check required Firebase variables
    check_var "FIREBASE_PROJECT_ID" || exit 1
    check_var "FIREBASE_CLIENT_EMAIL" || exit 1
    check_var "FIREBASE_PRIVATE_KEY" || exit 1
    
    echo "✅ Firebase credentials present"
    
    # Process Firebase private key
    if echo "$FIREBASE_PRIVATE_KEY" | grep -q "^base64:"; then
        echo "🔄 Decoding base64 private key..."
        export FIREBASE_PRIVATE_KEY=$(echo "$FIREBASE_PRIVATE_KEY" | sed 's/^base64://g' | base64 -d)
    elif echo "$FIREBASE_PRIVATE_KEY" | grep -q "PRIVATE KEY"; then
        echo "🔑 Private key appears to be in PEM format"
    elif echo "$FIREBASE_PRIVATE_KEY" | grep -q "your-private-key\|placeholder"; then
        echo "⚠️  Warning: Using placeholder Firebase private key"
        echo "This is okay for local testing, but won't work in production"
        export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9QFi67K3t\n-----END PRIVATE KEY-----"
    else
        echo "❌ Error: Invalid Firebase private key format"
        echo "The private key should be either:"
        echo "1. A base64-encoded key prefixed with 'base64:'"
        echo "2. A PEM-formatted key containing 'PRIVATE KEY'"
        echo "3. A placeholder value for local testing"
        exit 1
    fi
    
    # Log Firebase info (safely)
    echo "📂 Firebase Project ID: $FIREBASE_PROJECT_ID"
    echo "📧 Firebase Client Email: $FIREBASE_CLIENT_EMAIL"
    echo "🔐 Firebase Private Key is set (length: ${#FIREBASE_PRIVATE_KEY})"
    echo "🔑 Private Key starts with: $(echo "$FIREBASE_PRIVATE_KEY" | head -n 1)"
}

# Function to check Redis connection
check_redis() {
    echo "🔄 Checking Redis connection..."
    
    # Check required Redis variables
    check_var "REDIS_URL" || exit 1
    check_var "REDIS_HOST" || exit 1
    check_var "REDIS_PORT" || exit 1
    
    echo "✅ Redis environment variables present"
}

# Function to check OpenAI configuration
check_openai() {
    echo "🤖 Checking OpenAI configuration..."
    check_var "OPENAI_API_KEY" || exit 1
    echo "✅ OpenAI API key present"
}

# Main startup sequence
echo "🚀 Starting application..."

# Check all required services
check_firebase_creds
check_redis
check_openai

# Start the application
echo "📡 Starting Node.js application..."
node dist/server.js &
APP_PID=$!

# Wait for port to be available
echo "⏳ Waiting for application to start on port 8080..."
TIMEOUT=30
COUNT=0
while ! nc -z localhost 8080; do
    if ! ps -p $APP_PID > /dev/null; then
        echo "❌ Application process died unexpectedly"
        echo "📋 Application logs:"
        tail -n 50 /proc/1/fd/1 2>/dev/null || echo "No logs available"
        exit 1
    fi
    
    if [ $COUNT -eq $TIMEOUT ]; then
        echo "❌ Timeout waiting for application to start"
        echo "📋 Application logs:"
        tail -n 50 /proc/1/fd/1 2>/dev/null || echo "No logs available"
        kill $APP_PID
        exit 1
    fi
    
    echo "⏳ Still waiting... ($(($TIMEOUT-$COUNT)) seconds remaining)"
    COUNT=$((COUNT+1))
    sleep 1
done

# Check health endpoint
echo "🏥 Checking health endpoint..."
HEALTH_CHECK_TIMEOUT=30
COUNT=0
while [ $COUNT -lt $HEALTH_CHECK_TIMEOUT ]; do
    if curl -s http://localhost:8080/health > /dev/null; then
        echo "✅ Application is healthy!"
        # Keep the container running
        wait $APP_PID
        exit 0
    fi
    
    if ! ps -p $APP_PID > /dev/null; then
        echo "❌ Application process died during health check"
        echo "📋 Application logs:"
        tail -n 50 /proc/1/fd/1 2>/dev/null || echo "No logs available"
        exit 1
    fi
    
    echo "⏳ Waiting for health check... ($(($HEALTH_CHECK_TIMEOUT-$COUNT)) seconds remaining)"
    COUNT=$((COUNT+1))
    sleep 1
done

echo "❌ Health check failed after $HEALTH_CHECK_TIMEOUT seconds"
echo "📋 Application logs:"
tail -n 50 /proc/1/fd/1 2>/dev/null || echo "No logs available"
kill $APP_PID
exit 1 