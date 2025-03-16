# GitHub Actions for Testing Production Endpoints

This document explains how to use the GitHub Actions workflows for testing the production API endpoints of the Parenting Assistant Backend.

## Available Workflows

### 1. Automatic Testing After Deployment

The `test-production.yml` workflow automatically runs after a successful deployment to Cloud Run. It tests both public and authenticated endpoints to ensure that the API is working correctly.

This workflow is triggered:

- Automatically after a successful deployment to Cloud Run (via the "Deploy to Cloud Run" workflow)
- Manually via the GitHub Actions UI

### 2. Manual Testing

The `manual-test-production.yml` workflow allows you to manually test the production endpoints at any time. It provides options to test:

- All endpoints
- Only public endpoints
- Only authenticated endpoints

This workflow is triggered only manually via the GitHub Actions UI.

## Required Secrets

Both workflows require the following secrets to be set in your GitHub repository:

1. **Firebase Credentials**:

   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL`: Your Firebase service account email
   - `FIREBASE_PRIVATE_KEY`: Your Firebase private key (including BEGIN and END lines)
   - `FIREBASE_API_KEY`: Your Firebase Web API Key

2. **API Base URL** (optional):
   - `API_BASE_URL`: The base URL of your production API (defaults to the hardcoded URL in the test scripts if not provided)

## How to Run the Manual Workflow

1. Go to the "Actions" tab in your GitHub repository
2. Select "Manual Test Production Endpoints" from the list of workflows
3. Click the "Run workflow" button
4. Select the type of test you want to run:
   - `all`: Test both public and authenticated endpoints
   - `public_only`: Test only public endpoints
   - `authenticated_only`: Test only authenticated endpoints
5. Click "Run workflow"

## Troubleshooting

### Authentication Errors

If you see authentication errors in the workflow logs, it could be due to:

- Missing or incorrect Firebase credentials in your GitHub secrets
- Issues with the Firebase project configuration
- The Firebase service account not having the necessary permissions

### API Endpoint Errors

If you see errors related to the API endpoints, it could be due to:

- The API not being deployed correctly
- The API base URL being incorrect
- Changes in the API endpoint paths

In these cases, check the deployment logs and verify that the API is running correctly.
