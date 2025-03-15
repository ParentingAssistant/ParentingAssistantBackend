export interface AIResponse {
    id: string;
    prompt: string;
    response: string;
    model: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface CacheConfig {
    ttl: number; // Time to live in seconds
    namespace: string;
} 