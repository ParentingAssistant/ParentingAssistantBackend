# Testing the Production API

This document provides instructions on how to test the production API endpoints for the Parenting Assistant Backend.

## Prerequisites

- Node.js 18+
- npm
- Firebase project with authentication enabled
- Firebase service account credentials
- Firebase Web API Key

## Setup

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in the required environment variables in the `.env` file:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL`: Your Firebase service account email
   - `FIREBASE_PRIVATE_KEY`: Your Firebase private key (including BEGIN and END lines)
   - `FIREBASE_API_KEY`: Your Firebase Web API Key (found in the Firebase console under Project Settings > General)
   - Other environment variables as needed

## Testing Public Endpoints

To test the public endpoints (health and root) without authentication:

```bash
node test-production-no-auth.js
```

This will test the following endpoints:

- `GET /health`
- `GET /`
- `POST /api/meal-plans/generate-meal-plan` (will return 401)
- `POST /api/stories/generate-bedtime-story` (will return 401)

## Testing Protected Endpoints

To test the protected endpoints (meal plans and stories), you need a valid Firebase ID token.

### Step 1: Generate a Firebase ID Token

```bash
node generate-firebase-token.js
```

This script will:

1. Use your Firebase service account credentials to create a custom token
2. Exchange the custom token for an ID token
3. Output the ID token to use in your API requests

### Step 2: Update the Test Script with the New Token

```bash
node update-test-token.js <firebase-token>
```

Replace `<firebase-token>` with the ID token generated in Step 1.

### Step 3: Run the Test Script

```bash
node test-production.js
```

This will test all endpoints with the provided authentication token.

## Troubleshooting

### Invalid Token Error

If you receive a `401 Unauthorized` error with the message "Invalid authentication token", it means:

- The token has expired (Firebase ID tokens expire after 1 hour)
- The token is not a valid Firebase ID token
- The token is not associated with a user in your Firebase project

Generate a new token using the `generate-firebase-token.js` script.

### Missing Credentials

If the token generation script fails with a message about missing credentials, make sure:

- Your `.env` file contains all the required Firebase credentials
- The Firebase private key is properly formatted (including BEGIN and END lines)
- The Firebase API key is correct
