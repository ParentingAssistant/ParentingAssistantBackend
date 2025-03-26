# Scripts Directory

This directory contains various utility scripts for the Parenting Assistant API.

## Directory Structure

- `test/`: Contains scripts for testing the API

  - `test.sh`: Main test script with menu-driven interface
  - `test-production.js`: Production endpoint testing
  - `test-production-no-auth.js`: Production endpoint testing without auth
  - `update-test-token.js`: Token update utility
  - `generate-firebase-token.js`: Firebase token generation
  - `TESTING.md`: Testing documentation
  - `README.md`: Documentation for test scripts

- `deploy/`: Contains scripts for deployment and management
  - `run-local.sh`: Script to run the application locally
  - `verify-health.sh`: Script to verify application health
  - `deploy-cloud-run.sh`: Cloud Run deployment script
  - `docker-compose.yml`: Docker Compose configuration
  - `.dockerignore`: Docker ignore rules
  - `deployment.yaml`: Kubernetes deployment configuration
  - `README.md`: Documentation for deployment scripts

## Configuration Files

- `parentingassistant-9b1cb-firebase-adminsdk-fbsvc-a29ba88dc3.json`: Firebase Admin SDK credentials
- `GoogleService-Info.plist`: iOS Firebase configuration

## Usage

1. For testing:

   ```bash
   cd test
   ./test.sh
   ```

2. For deployment:

   ```bash
   cd deploy
   ./run-local.sh
   ```

3. For token generation:
   ```bash
   cd test
   node generate-firebase-token.js
   ```

## Requirements

- Node.js and npm installed
- Docker installed and running
- Environment variables set in `.env` file
- Firebase credentials configured
- Google Cloud SDK installed (for Cloud Run deployment)
