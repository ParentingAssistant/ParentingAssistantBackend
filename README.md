# Parenting Assistant Backend

A Node.js backend service that provides AI-powered meal planning and bedtime story generation through RESTful APIs.

## Features

- 🍽️ AI-powered meal plan generation
- 📚 Personalized bedtime story creation
- 🔒 Secure Firebase Authentication
- 🚀 Rate limiting and request caching
- 📝 Comprehensive API documentation

## Documentation

- [API Documentation](API.md) - Detailed API endpoints and usage
- [Deployment Guide](deploy.sh) - Instructions for deploying to Google Cloud Run

## Tech Stack

- Node.js & Express
- TypeScript
- Firebase Authentication & Firestore
- Redis for caching
- OpenAI API
- Docker
- Google Cloud Run

## Prerequisites

- Node.js 18 or higher
- Docker
- Redis
- Firebase project
- OpenAI API key
- Google Cloud account

## Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd parenting-assistant-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Redis**

   ```bash
   docker compose up redis -d
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Docker Development

```bash
# Build and start all services
docker compose up --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Deployment

### Manual Deployment

```bash
# Deploy to Google Cloud Run
./deploy.sh
```

### Automated Deployment

The project uses GitHub Actions for automated deployment to Google Cloud Run.
Push to the `main` branch to trigger deployment.

## Environment Variables

Required environment variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_WINDOW_MS=3600000
AI_RATE_LIMIT_MAX_REQUESTS=50
```

## API Endpoints

- `POST /api/generate-meal-plan` - Generate personalized meal plans
- `POST /api/generate-bedtime-story` - Generate personalized bedtime stories

See [API Documentation](API.md) for detailed endpoint specifications.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
