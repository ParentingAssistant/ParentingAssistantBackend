import { AIResponse, CacheConfig } from '../types/ai-response';
import { firebaseStorage } from '../config/firebase';
import { redisCache } from '../config/redis';

export class AICacheService {
    private static instance: AICacheService;
    private readonly defaultConfig: CacheConfig = {
        ttl: 3600,
        namespace: 'ai-responses'
    };

    private constructor() {}

    public static getInstance(): AICacheService {
        if (!AICacheService.instance) {
            AICacheService.instance = new AICacheService();
        }
        return AICacheService.instance;
    }

    /**
     * Store AI response with caching strategy
     * 1. Store in Redis for fast access
     * 2. Store in Firestore for persistence
     */
    async storeResponse(
        response: AIResponse,
        config: Partial<CacheConfig> = {}
    ): Promise<string> {
        try {
            // Store in Firestore
            const id = await firebaseStorage.storeResponse(response);
            
            // Store in Redis cache
            const cacheConfig = { ...this.defaultConfig, ...config };
            await redisCache.setResponse({ ...response, id }, cacheConfig);
            await redisCache.setResponseByPrompt({ ...response, id }, cacheConfig);

            return id;
        } catch (error) {
            console.error('Error storing AI response:', error);
            throw error;
        }
    }

    /**
     * Retrieve AI response with caching strategy
     * 1. Try Redis first
     * 2. If not found, try Firestore
     * 3. If found in Firestore, update Redis cache
     */
    async getResponse(id: string): Promise<AIResponse | null> {
        try {
            // Try Redis first
            let response = await redisCache.getResponse(id);
            
            if (!response) {
                // Try Firestore if not in Redis
                response = await firebaseStorage.getResponse(id);
                
                // Update Redis cache if found in Firestore
                if (response) {
                    await redisCache.setResponse(response);
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error retrieving AI response:', error);
            throw error;
        }
    }

    /**
     * Get response by prompt with caching strategy
     */
    async getResponseByPrompt(prompt: string): Promise<AIResponse | null> {
        try {
            // Try Redis first
            let response = await redisCache.getResponseByPrompt(prompt);
            
            if (!response) {
                // Try Firestore if not in Redis
                const responses = await firebaseStorage.queryResponsesByPrompt(prompt, 1);
                response = responses[0] || null;
                
                // Update Redis cache if found in Firestore
                if (response) {
                    await redisCache.setResponseByPrompt(response);
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error retrieving AI response by prompt:', error);
            throw error;
        }
    }

    /**
     * Delete response from both Redis and Firestore
     */
    async deleteResponse(id: string): Promise<void> {
        try {
            // Delete from Redis
            await redisCache.deleteResponse(id);
            
            // Delete from Firestore
            await firebaseStorage.deleteExpiredResponses(Date.now());
        } catch (error) {
            console.error('Error deleting AI response:', error);
            throw error;
        }
    }
} 