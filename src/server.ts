import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase';
import { initializeRedis } from './config/redis';
import { CleanupService } from './services/cleanup.service';
import { apiLimiter } from './config/security';
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
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
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

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Initialize services
try {
    console.log('🔥 Initializing Firebase...');
    initializeFirebase();
    
    console.log('📦 Initializing Redis...');
    initializeRedis();
    
    console.log('🧹 Starting cleanup service...');
    const cleanupService = CleanupService.getInstance();
    cleanupService.startCleanupScheduler();
} catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received. Starting graceful shutdown...');
    const cleanupService = CleanupService.getInstance();
    cleanupService.stopCleanupScheduler();
    // Add any other cleanup here
    process.exit(0);
});

// Routes
app.use('/api', mealPlanRoutes);
app.use('/api', storyRoutes);

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Start server
const PORT = Number(process.env.PORT) || 8080; // Default to 8080 for Cloud Run
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 Server startup complete!');
    console.log('---------------------------');
    console.log(`📡 Server listening on port ${PORT}`);
    console.log(`💚 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
    console.log(`⏰ Startup time: ${new Date().toISOString()}`);
    console.log('---------------------------\n');
}).on('error', (error: Error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}); 