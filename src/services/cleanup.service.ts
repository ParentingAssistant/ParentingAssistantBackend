import { db } from '../config/firebase';
import redisClient from '../config/redis';
import { CACHE_CONFIG } from '../config/cache';

export class CleanupService {
    private static instance: CleanupService;
    private cleanupInterval: NodeJS.Timeout | null = null;

    private constructor() {}

    public static getInstance(): CleanupService {
        if (!CleanupService.instance) {
            CleanupService.instance = new CleanupService();
        }
        return CleanupService.instance;
    }

    /**
     * Start the cleanup scheduler
     */
    public startCleanupScheduler(): void {
        if (this.cleanupInterval) {
            return; // Already running
        }

        this.cleanupInterval = setInterval(
            () => this.performCleanup(),
            CACHE_CONFIG.cleanup.interval
        );

        // Run initial cleanup
        this.performCleanup();
    }

    /**
     * Stop the cleanup scheduler
     */
    public stopCleanupScheduler(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Perform the cleanup operation
     */
    private async performCleanup(): Promise<void> {
        try {
            console.log('Starting cache cleanup...');
            
            // Run cleanup tasks in parallel
            await Promise.all([
                this.cleanupFirestore(),
                this.cleanupRedis()
            ]);

            console.log('Cache cleanup completed successfully');
        } catch (error) {
            console.error('Error during cache cleanup:', error);
        }
    }

    /**
     * Clean up expired documents in Firestore
     */
    private async cleanupFirestore(): Promise<void> {
        const batchSize = CACHE_CONFIG.firestore.batchSize;
        const expirationTime = Date.now() - CACHE_CONFIG.cleanup.maxAge;

        try {
            // Get expired documents
            const snapshot = await db
                .collection('ai-responses')
                .where('timestamp', '<', expirationTime)
                .limit(batchSize)
                .get();

            if (snapshot.empty) {
                return;
            }

            // Delete in batches
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`Deleted ${snapshot.size} expired documents from Firestore`);

            // If we hit the batch size, there might be more to delete
            if (snapshot.size === batchSize) {
                await this.cleanupFirestore();
            }
        } catch (error) {
            console.error('Error cleaning up Firestore:', error);
            throw error;
        }
    }

    /**
     * Clean up expired keys in Redis
     */
    private async cleanupRedis(): Promise<void> {
        try {
            // Scan for keys with our prefix
            let cursor = 0;
            do {
                const result = await redisClient.scan(
                    cursor,
                    {
                        MATCH: `${CACHE_CONFIG.redis.keyPrefix}*`,
                        COUNT: 100
                    }
                );

                cursor = parseInt(result.cursor);
                const keys = result.keys;

                if (keys.length > 0) {
                    // Get TTL for each key
                    const pipeline = redisClient.multi();
                    keys.forEach(key => {
                        pipeline.ttl(key);
                    });

                    const ttls = await pipeline.exec();
                    
                    // Delete keys with no TTL or expired TTL
                    const keysToDelete = keys.filter((key, index) => {
                        const ttl = ttls?.[index] as number;
                        return ttl === -1 || ttl === -2;
                    });

                    if (keysToDelete.length > 0) {
                        await redisClient.del(keysToDelete);
                        console.log(`Deleted ${keysToDelete.length} expired keys from Redis`);
                    }
                }
            } while (cursor !== 0);
        } catch (error) {
            console.error('Error cleaning up Redis:', error);
            throw error;
        }
    }

    /**
     * Force immediate cleanup
     */
    public async forceCleanup(): Promise<void> {
        await this.performCleanup();
    }
} 