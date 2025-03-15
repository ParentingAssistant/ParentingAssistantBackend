export const CACHE_CONFIG = {
    redis: {
        defaultTTL: 3600, // 1 hour in seconds
        maxTTL: 86400, // 24 hours in seconds
        keyPrefix: 'ai-response:',
    },
    firestore: {
        defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        maxTTL: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        batchSize: 500, // Maximum number of documents to delete in one batch
    },
    cleanup: {
        interval: 24 * 60 * 60 * 1000, // Run cleanup every 24 hours
        maxAge: 7 * 24 * 60 * 60 * 1000, // Delete responses older than 7 days
    }
}; 