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

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Initialize services
initializeFirebase();
initializeRedis();

// Start cleanup service
const cleanupService = CleanupService.getInstance();
cleanupService.startCleanupScheduler();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Starting graceful shutdown...');
    cleanupService.stopCleanupScheduler();
    // Add any other cleanup here
    process.exit(0);
});

// Routes
app.use('/api', mealPlanRoutes);
app.use('/api', storyRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 