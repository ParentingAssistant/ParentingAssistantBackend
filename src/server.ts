import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import mealPlanRoutes from './routes/meal-plan.routes';
import storyRoutes from './routes/story.routes';
import { initializeRedis } from './config/redis';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint - respond immediately without waiting for Redis
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/story', storyRoutes);

// Serve the Firebase client HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server first
const server = app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});

// Then try to connect to Redis in the background
initializeRedis().catch(error => {
    console.error('Failed to initialize Redis:', error);
    console.warn('Server will continue without Redis - using memory store fallback');
}); 