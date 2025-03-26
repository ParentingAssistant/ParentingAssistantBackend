# Test Scripts

This directory contains scripts for testing the Parenting Assistant API.

## Available Scripts

- `test.sh`: Main test script that provides a menu-driven interface for:
  - Testing local environment
  - Testing production environment
  - Testing deployment
- `test-production.js`: Script to test production endpoints with authentication
- `test-production-no-auth.js`: Script to test production endpoints without authentication
- `update-test-token.js`: Script to update test tokens
- `generate-firebase-token.js`: Script to generate Firebase authentication tokens
- `TESTING.md`: Testing documentation

## Usage

### Running Tests

1. Make the script executable:

   ```bash
   chmod +x test.sh
   ```

2. Run the test script:

   ```bash
   ./test.sh
   ```

3. Select an option from the menu:
   - 1: Test Local Environment
   - 2: Test Production Environment
   - 3: Test Deployment
   - 4: Exit

### Testing Production Endpoints

1. Test with authentication:

   ```bash
   node test-production.js
   ```

2. Test without authentication:
   ```bash
   node test-production-no-auth.js
   ```

### Token Generation

1. Generate a Firebase token:

   ```bash
   node generate-firebase-token.js
   ```

2. Update test tokens:
   ```bash
   node update-test-token.js
   ```

## Requirements

- Docker installed and running
- Node.js and npm installed
- Firebase token for authenticated endpoints
- Environment variables set in `.env` file
