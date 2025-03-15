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
                // Use the scanIterator method instead of scan
                for await (const key of redisClient.scanIterator({
                    MATCH: `${CACHE_CONFIG.redis.keyPrefix}*`,
                    COUNT: 100
                })) {
                    // Get TTL for the key
                    const ttl = await redisClient.ttl(key);
                    
                    // Delete key if it has no TTL or is expired
                    if (ttl === -1 || ttl === -2) {
                        await redisClient.del(key);
                        console.log(`Deleted expired key from Redis: ${key}`);
                    }
                }
                break; // scanIterator handles the cursor internally
            } while (cursor !== 0); // This is now redundant but kept for structure
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