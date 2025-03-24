import axios from 'axios';
import { InferenceOptions } from '../inference.service';

export class TogetherAIProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.together.xyz/v1/completions';

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('TOGETHER_API_KEY environment variable is not set.');
    }
  }

  public async runInference(prompt: string, options: InferenceOptions = {}): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Together AI API key is not configured');
      }

      const model = options.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
      const temperature = options.temperature ?? 0.7;
      const maxTokens = options.maxTokens ?? 1000;

      const response = await axios.post(
        this.baseUrl,
        {
          model,
          prompt,
          temperature,
          max_tokens: maxTokens,
          stop: options.stop || null
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Together AI API returned status code ${response.status}`);
      }

      if (!response.data?.choices?.[0]?.text) {
        throw new Error('Failed to generate content: No content received from Together AI');
      }

      return response.data.choices[0].text;
    } catch (error) {
      console.error('Together AI inference error:', error);
      throw new Error(`Together AI inference failed: ${(error as Error).message}`);
    }
  }
} 