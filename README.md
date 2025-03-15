# Parenting Assistant Backend

A Node.js backend service that handles AI API calls with Firebase Firestore and Redis caching.

## Features

- Express.js REST API
- Firebase Firestore integration
- Redis caching
- Rate limiting
- CORS enabled
- Environment variable configuration
- TypeScript support

## Prerequisites

- Node.js (v14 or higher)
- Redis server
- Firebase project credentials

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the variables:
   ```bash
   cp .env.example .env
   ```
4. Update the following environment variables in `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `REDIS_URL` (if not using default)

## Development

Run the development server:

```bash
npm run dev
```

## Production

Build and start the production server:

```bash
npm run build
npm start
```

## API Documentation

[API documentation will be added here]

## License

ISC
