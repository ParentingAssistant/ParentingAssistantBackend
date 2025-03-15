import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import './config/firebase'; // Firebase is initialized when imported
import { initializeRedis } from './config/redis';
import { CleanupService } from './services/cleanup.service';
import { createRateLimiters } from './config/security';
import mealPlanRoutes from './routes/meal-plan.routes';
import storyRoutes from './routes/story.routes';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'REDIS_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_AUTH_STRING',
    'OPENAI_API_KEY',
    'API_RATE_LIMIT_WINDOW_MS',
    'API_RATE_LIMIT_MAX_REQUESTS',
    'AI_RATE_LIMIT_WINDOW_MS',
    'AI_RATE_LIMIT_MAX_REQUESTS',
    'CACHE_TTL',
    'CACHE_NAMESPACE'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => {
        console.error(`   - ${envVar}`);
    });
    process.exit(1);
}

// Log successful environment variable validation
console.log('✅ All required environment variables are present');

// Create Express app
const app = express();
const port = process.env.PORT || 8080;

// Initialize services and start server
async function startServer() {
    try {
        // Initialize Redis first
        console.log('📦 Initializing Redis...');
        await initializeRedis();
        
        // Initialize cleanup service
        console.log('🧹 Starting cleanup service...');
        const cleanupService = CleanupService.getInstance();
        cleanupService.startCleanupScheduler();

        // Setup Express middleware after Redis is connected
        app.use(cors());
        app.use(helmet());
        app.use(express.json());

        // Create rate limiters after Redis is connected
        const { apiLimiter } = createRateLimiters();
        app.use(apiLimiter);

        // Root endpoint
        app.get('/', (req, res) => {
            res.json({
                status: 'success',
                message: 'Parenting Assistant Backend is running',
                timestamp: new Date().toISOString()
            });
        });

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });

        // Routes
        app.use('/api/meal-plans', mealPlanRoutes);
        app.use('/api/stories', storyRoutes);

        // Start server
        app.listen(port, () => {
            console.log('\n🚀 Server startup complete!');
            console.log('---------------------------');
            console.log(`📡 Server listening on port ${port}`);
            console.log(`🌍 Root endpoint: http://0.0.0.0:${port}/`);
            console.log(`💚 Health check: http://0.0.0.0:${port}/health`);
            console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
            console.log(`⏰ Startup time: ${new Date().toISOString()}`);
            console.log('---------------------------\n');
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('🛑 SIGTERM received. Starting graceful shutdown...');
            const cleanupService = CleanupService.getInstance();
            cleanupService.stopCleanupScheduler();
            // Add any other cleanup here
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        process.exit(1);
    }
}

// Start the server
startServer(); 