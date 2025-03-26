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
        tls: true,
        rejectUnauthorized: false, // Required for Upstash
        connectTimeout: 15000, // Increased timeout
        keepAlive: 5000, // Increased keepalive
        reconnectStrategy: (retries: number, cause: Error) => {
            console.log(`Redis reconnection attempt ${retries + 1}/${MAX_CONNECTION_ATTEMPTS}`);
            if (retries >= MAX_CONNECTION_ATTEMPTS) {
                console.error('Max Redis retry attempts reached:', cause);
                return false; // Stop retrying
            }
            // Exponential backoff with max of 10 seconds
            return Math.min(Math.pow(2, retries) * 1000, 10000);
        }
    }
});

export const initializeRedis = async (): Promise<void> => {
    if (isConnected && redisClient.isOpen) {
        console.log('Redis is already connected');
        return;
    }

    // If client is open but not connected, close it first
    if (redisClient.isOpen) {
        try {
            await redisClient.disconnect();
        } catch (error) {
            console.warn('Error disconnecting Redis client:', error);
        }
    }

    try {
        // Add event listeners before connecting
        redisClient.on('error', (error) => {
            console.error('Redis error:', error);
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Redis client connected');
            connectionAttempts = 0;
            isConnected = true;
        });

        redisClient.on('ready', () => {
            console.log('Redis client ready');
            isConnected = true;
            connectionAttempts = 0;
        });

        redisClient.on('reconnecting', () => {
            console.log('Redis client reconnecting...');
            isConnected = false;
        });

        redisClient.on('end', () => {
            console.log('Redis connection ended');
            isConnected = false;
        });

        // Try to connect with a timeout matching the socket timeout
        const connectWithTimeout = async () => {
            try {
                await Promise.race([
                    redisClient.connect(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Redis connection timeout')), 15000)
                    )
                ]);
                
                // Test the connection
                await redisClient.ping();
                console.log('Redis connection test successful');
                isConnected = true;
            } catch (error) {
                console.error('Redis connection failed:', error);
                isConnected = false;
                throw error;
            }
        };

        // Initial connection attempt
        try {
            await connectWithTimeout();
        } catch (error) {
            console.error('Initial Redis connection failed:', error);
            // Don't block server startup on Redis failure
            console.warn('Server will continue without Redis - using memory store fallback');
        }
    } catch (error) {
        console.error('Error in Redis initialization:', error);
        console.warn('Server will continue without Redis - using memory store fallback');
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