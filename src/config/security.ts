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

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: SECURITY_CONFIG.api.rateLimitWindowMs,
    max: SECURITY_CONFIG.api.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix: 'rate-limit:api:'
    }),
    message: {
        status: 'error',
        message: 'Too many requests, please try again later.'
    }
});

// AI endpoints rate limiter (stricter)
export const aiLimiter = rateLimit({
    windowMs: SECURITY_CONFIG.ai.rateLimitWindowMs,
    max: SECURITY_CONFIG.ai.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix: 'rate-limit:ai:'
    }),
    keyGenerator: (req) => {
        // Use user ID from Firebase Auth for rate limiting
        return `user:${req.user?.uid || req.ip}`;
    },
    message: {
        status: 'error',
        message: 'AI request limit exceeded, please try again later.'
    }
}); 