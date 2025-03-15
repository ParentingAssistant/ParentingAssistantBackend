import { createClient } from 'redis';
import { AIResponse, CacheConfig } from '../types/ai-response';

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
    ttl: 3600, // 1 hour
    namespace: 'ai-responses'
};

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Max Redis reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
        }
    }
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

// Redis helper functions
export const redisCache = {
    // Generate cache key
    generateKey: (namespace: string, identifier: string): string => {
        return `${namespace}:${identifier}`;
    },

    // Store AI response in Redis
    setResponse: async (
        response: AIResponse,
        config: Partial<CacheConfig> = {}
    ): Promise<void> => {
        const { namespace, ttl } = { ...DEFAULT_CACHE_CONFIG, ...config };
        const key = redisCache.generateKey(namespace, response.id);
        
        try {
            await redisClient.setEx(
                key,
                ttl,
                JSON.stringify(response)
            );
        } catch (error) {
            console.error('Error caching response in Redis:', error);
            throw error;
        }
    },

    // Retrieve AI response from Redis
    getResponse: async (
        id: string,
        namespace: string = DEFAULT_CACHE_CONFIG.namespace
    ): Promise<AIResponse | null> => {
        const key = redisCache.generateKey(namespace, id);
        
        try {
            const cachedResponse = await redisClient.get(key);
            return cachedResponse ? JSON.parse(cachedResponse) : null;
        } catch (error) {
            console.error('Error retrieving response from Redis:', error);
            throw error;
        }
    },

    // Store response with prompt as key
    setResponseByPrompt: async (
        response: AIResponse,
        config: Partial<CacheConfig> = {}
    ): Promise<void> => {
        const { namespace, ttl } = { ...DEFAULT_CACHE_CONFIG, ...config };
        const promptKey = redisCache.generateKey(namespace, `prompt:${response.prompt}`);
        
        try {
            await redisClient.setEx(
                promptKey,
                ttl,
                JSON.stringify(response)
            );
        } catch (error) {
            console.error('Error caching response by prompt in Redis:', error);
            throw error;
        }
    },

    // Get response by prompt
    getResponseByPrompt: async (
        prompt: string,
        namespace: string = DEFAULT_CACHE_CONFIG.namespace
    ): Promise<AIResponse | null> => {
        const promptKey = redisCache.generateKey(namespace, `prompt:${prompt}`);
        
        try {
            const cachedResponse = await redisClient.get(promptKey);
            return cachedResponse ? JSON.parse(cachedResponse) : null;
        } catch (error) {
            console.error('Error retrieving response by prompt from Redis:', error);
            throw error;
        }
    },

    // Delete cached response
    deleteResponse: async (
        id: string,
        namespace: string = DEFAULT_CACHE_CONFIG.namespace
    ): Promise<void> => {
        const key = redisCache.generateKey(namespace, id);
        
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('Error deleting response from Redis:', error);
            throw error;
        }
    }
};

export default redisClient; 