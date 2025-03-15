import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL
});

export const initializeRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis connected successfully');
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        process.exit(1);
    }
};

redisClient.on('error', (error) => {
    console.error('Redis error:', error);
});

export default redisClient; 