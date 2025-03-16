import { createClient } from 'redis';
import { AIResponse, CacheConfig } from '../types/ai-response';

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
    ttl: 3600, // 1 hour
    namespace: 'ai-responses'
};

// Track connection status
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const RETRY_DELAY = 3000; // 3 seconds

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        // Only enable TLS for production (Upstash)
        ...(process.env.REDIS_URL?.includes('upstash.io') ? {
            tls: true,
            rejectUnauthorized: true,
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('Max Redis reconnection attempts reached');
                    return new Error('Max reconnection attempts reached');
                }
                return Math.min(retries * 1000, 10000); // Exponential backoff up to 10 seconds
            }
        } : {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('Max Redis reconnection attempts reached');
                    return new Error('Max reconnection attempts reached');
                }
                return Math.min(retries * 1000, 10000); // Exponential backoff up to 10 seconds
            }
        })
    }
});

export const initializeRedis = async (): Promise<void> => {
    if (isConnected) {
        console.log('Redis is already connected');
        return;
    }

    try {
        // Add event listeners before connecting
        redisClient.on('error', (error) => {
            console.error('Redis error:', error);
            isConnected = false;
            connectionAttempts++;

            if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
                console.error(`Failed to connect to Redis after ${MAX_CONNECTION_ATTEMPTS} attempts`);
                console.warn('Continuing without Redis - using memory store fallback');
                return;
            }

            // Attempt to reconnect
            setTimeout(async () => {
                console.log(`Attempting to reconnect to Redis (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);
                try {
                    await redisClient.connect();
                } catch (error) {
                    console.error('Redis reconnection failed:', error);
                }
            }, RETRY_DELAY);
        });

        redisClient.on('connect', () => {
            console.log('Redis client connected');
            connectionAttempts = 0; // Reset connection attempts on successful connection
        });

        redisClient.on('ready', () => {
            console.log('Redis client ready');
            isConnected = true;
            connectionAttempts = 0; // Reset connection attempts on ready
        });

        redisClient.on('reconnecting', () => {
            console.log('Redis client reconnecting...');
            isConnected = false;
        });

        redisClient.on('end', () => {
            console.log('Redis connection ended');
            isConnected = false;
        });

        // Connect to Redis
        await redisClient.connect();
        
        // Test the connection
        await redisClient.ping();
        console.log('Redis connection test successful');
        isConnected = true;
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        isConnected = false;
        
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            connectionAttempts++;
            console.log(`Retrying Redis connection (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return initializeRedis();
        } else {
            console.warn('Failed to connect to Redis - using memory store fallback');
        }
    }
};

// Redis helper functions
export const redisCache = {
    // Check connection before operations
    ensureConnection: async () => {
        if (!isConnected) {
            try {
                await initializeRedis();
            } catch (error) {
                console.error('Failed to reconnect to Redis:', error);
                throw error;
            }
        }
    },

    // Generate cache key
    generateKey: (namespace: string, identifier: string): string => {
        return `${namespace}:${identifier}`;
    },

    // Store AI response in Redis
    setResponse: async (
        response: AIResponse,
        config: Partial<CacheConfig> = {}
    ): Promise<void> => {
        await redisCache.ensureConnection();
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
        await redisCache.ensureConnection();
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
        await redisCache.ensureConnection();
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
        await redisCache.ensureConnection();
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
        await redisCache.ensureConnection();
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