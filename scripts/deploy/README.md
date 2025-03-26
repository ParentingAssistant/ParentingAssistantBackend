# Deployment Scripts

This directory contains scripts for deploying and managing the Parenting Assistant API.

## Available Scripts

- `run-local.sh`: Script to run the application locally with Docker
- `verify-health.sh`: Script to verify the health of the deployed application
- `deploy-cloud-run.sh`: Script to deploy to Google Cloud Run
- `docker-compose.yml`: Docker Compose configuration
- `.dockerignore`: Docker ignore rules
- `deployment.yaml`: Kubernetes deployment configuration

## Usage

### Running Locally

1. Make the script executable:

   ```bash
   chmod +x run-local.sh
   ```

2. Run the local environment:
   ```bash
   ./run-local.sh
   ```

### Deploying to Cloud Run

1. Make the script executable:

   ```bash
   chmod +x deploy-cloud-run.sh
   ```

2. Deploy to Cloud Run:
   ```bash
   ./deploy-cloud-run.sh
   ```

### Verifying Health

1. Make the script executable:

   ```bash
   chmod +x verify-health.sh
   ```

2. Check the health of the deployed application:
   ```bash
   ./verify-health.sh
   ```

## Requirements

- Docker installed and running
- Environment variables set in `.env` file
- Access to the deployment environment
- Google Cloud SDK installed (for Cloud Run deployment)
