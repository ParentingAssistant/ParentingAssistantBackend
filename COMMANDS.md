# Useful Terminal Commands

## Local Development

### Start Local Server

```bash
# Start the local server
./scripts/run-local.sh

# Start with specific environment file
./scripts/run-local.sh .env.test
```

### Generate Firebase Token

```bash
# Generate a Firebase token using the test environment
node -r dotenv/config scripts/generate-token.js dotenv_config_path=.env.test

# Generate a Firebase token using a service account key file
node scripts/generate-token.js path/to/service-account.json
```

### Test Endpoints

```bash
# Test all endpoints (unauthenticated)
./scripts/test-endpoints.sh

# Test with Firebase token
FIREBASE_TOKEN="your-token-here" ./scripts/test-endpoints.sh
```

### Verify Health

```bash
# Check if the service is healthy
./scripts/verify-health.sh
```

## Deployment

### Deploy to Cloud Run

```bash
# Deploy the service
./scripts/test-deploy.sh

# Deploy with specific environment
./scripts/test-deploy.sh .env.test
```

### Test Production

```bash
# Test production endpoints
./scripts/test-production.sh

# Test with service account key file
./scripts/test-production.sh path/to/service-account.json
```

## Firebase Token Generation

### Using Web App

```bash
# Open the Firebase token generation web app
open scripts/get-token.html
```

### Using Service Account

```bash
# Generate token using service account
node scripts/generate-token.js scripts/parentingassistant-9b1cb-firebase-adminsdk-fbsvc-a29ba88dc3.json
```

## Environment Setup

### Create Environment Files

```bash
# Create test environment file
cp .env.example .env.test

# Create development environment file
cp .env.example .env.development
```

### Update Environment Variables

```bash
# Update test token in test script
node scripts/update-test-token.js "your-token-here"
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/meal-plans.test.js

# Run tests with coverage
npm run test:coverage
```

### Lint Code

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Docker

### Build and Run Docker

```bash
# Build Docker image
docker build -t parenting-assistant-backend .

# Run Docker container
docker run -p 3000:3000 --env-file .env.test parenting-assistant-backend
```

## Git

### Common Git Commands

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Switch to existing branch
git checkout feature/new-feature

# Pull latest changes
git pull origin main

# Push changes
git push origin feature/new-feature

# View status
git status

# View logs
git log --oneline
```

## Notes

- Always use the appropriate environment file for your use case
- Keep sensitive files (service account keys, .env files) out of version control
- Use the test scripts to verify endpoints before and after deployment
- The Firebase token generation web app is useful for quick testing
