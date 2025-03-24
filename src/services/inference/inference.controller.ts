import { Request, Response } from 'express';
import { InferenceService, InferenceOptions } from './inference.service';
import { AICacheService } from '../ai-cache.service';
import crypto from 'crypto';

// Initialize services
const inferenceService = InferenceService.getInstance();
const cacheService = AICacheService.getInstance();

// Generate a cache key from the prompt and provider
const generateCacheKey = (prompt: string, provider: string, options: any = {}): string => {
  // Create a normalized object for consistent hashing
  const normalizedData = {
    prompt: prompt.trim(),
    provider: provider.toLowerCase(),
    // Include other significant options that would affect the output
    model: options.model || 'default',
    temperature: options.temperature || 0.7,
    maxTokens: options.maxTokens || 1000
  };
  
  return crypto
    .createHash('md5')
    .update(JSON.stringify(normalizedData))
    .digest('hex');
};

/**
 * Handle inference requests with caching
 */
export const handleInferenceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, provider = 'openai', ...otherOptions } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Prompt is required and must be a string'
      });
      return;
    }

    // Check if valid provider
    if (!['openai', 'huggingface', 'togetherai'].includes(provider)) {
      res.status(400).json({
        status: 'error',
        message: 'Provider must be one of: openai, huggingface, togetherai'
      });
      return;
    }

    // Generate cache key
    const cacheKey = generateCacheKey(prompt, provider, otherOptions);
    
    // Try to get from cache first
    const cachedResponse = await cacheService.getResponseByPrompt(cacheKey);
    if (cachedResponse && cachedResponse.response) {
      console.log(`Cache hit for prompt using provider ${provider}`);
      
      res.json({
        status: 'success',
        data: cachedResponse.response,
        cached: true
      });
      return;
    }

    // No cache hit, call the appropriate provider
    console.log(`Cache miss for prompt using provider ${provider}, calling AI service`);
    
    const options: InferenceOptions = {
      provider: provider as 'openai' | 'huggingface' | 'togetherai',
      ...otherOptions
    };
    
    const result = await inferenceService.runInference(prompt, options);
    
    // Cache the result
    await cacheService.storeResponse({
      id: cacheKey,
      prompt: cacheKey,
      response: result,
      model: options.model || 'default',
      timestamp: Date.now(),
      metadata: {
        provider,
        originalPrompt: prompt,
        ...otherOptions
      }
    });

    res.json({
      status: 'success',
      data: result,
      cached: false
    });
  } catch (error) {
    console.error('Error processing inference request:', error);
    res.status(500).json({
      status: 'error',
      message: `Error processing inference request: ${(error as Error).message}`
    });
  }
}; 