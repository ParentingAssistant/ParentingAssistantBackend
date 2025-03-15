import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './redis';

export const SECURITY_CONFIG = {
    api: {
        rateLimitWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'),
        rateLimitMaxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100')
    },
    ai: {
        rateLimitWindowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '3600000'),
        rateLimitMaxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '50')
    }
};

// Create rate limiters with memory store fallback
const createLimiter = (options: {
    windowMs: number;
    max: number;
    prefix: string;
    keyGenerator?: (req: any) => string;
}) => {
    const config = {
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        skipFailedRequests: true,
        handler: (req: any, res: any) => {
            res.status(429).json({
                status: 'error',
                message: 'Too many requests, please try again later.',
                retryAfter: Math.ceil(options.windowMs / 1000)
            });
        }
    };

    // Try to use Redis store if client is ready
    if (redisClient.isReady) {
        try {
            return rateLimit({
                ...config,
                store: new RedisStore({
                    // @ts-ignore - Types are not properly aligned
                    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
                    prefix: `rate-limit:${options.prefix}:`,
                    resetExpiryOnChange: true
                }),
                keyGenerator: options.keyGenerator
            });
        } catch (error) {
            console.warn(`Failed to create Redis store for ${options.prefix}, falling back to memory store:`, error);
        }
    } else {
        console.warn(`Redis not ready for ${options.prefix}, using memory store`);
    }

    // Fall back to memory store
    return rateLimit({
        ...config,
        keyGenerator: options.keyGenerator
    });
};

// Export rate limiters factory
export const createRateLimiters = () => {
    // General API rate limiter
    const apiLimiter = createLimiter({
        windowMs: SECURITY_CONFIG.api.rateLimitWindowMs,
        max: SECURITY_CONFIG.api.rateLimitMaxRequests,
        prefix: 'api'
    });

    // AI endpoints rate limiter (stricter)
    const aiLimiter = createLimiter({
        windowMs: SECURITY_CONFIG.ai.rateLimitWindowMs,
        max: SECURITY_CONFIG.ai.rateLimitMaxRequests,
        prefix: 'ai',
        keyGenerator: (req) => `user:${req.user?.uid || req.ip}`
    });

    return { apiLimiter, aiLimiter };
}; 