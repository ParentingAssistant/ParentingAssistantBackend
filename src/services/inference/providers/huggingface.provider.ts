import axios from 'axios';
import { InferenceOptions } from '../inference.service';

export class HuggingFaceProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.baseUrl = process.env.HUGGINGFACE_MODEL_URL || 'https://api-inference.huggingface.co/models';
    
    if (!this.apiKey) {
      console.warn('HUGGINGFACE_API_KEY environment variable is not set.');
    }
  }

  public async runInference(prompt: string, options: InferenceOptions = {}): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Hugging Face API key is not configured');
      }

      const model = options.model || 'mistralai/Mistral-7B-Instruct-v0.2';
      const url = this.baseUrl.includes('/models') ? 
        `${this.baseUrl}/${model}` : 
        this.baseUrl;
      
      const response = await axios.post(
        url,
        { inputs: prompt },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Hugging Face API returned status code ${response.status}`);
      }

      // Handle different response formats based on the model
      if (Array.isArray(response.data) && response.data[0]?.generated_text) {
        return response.data[0].generated_text;
      } else if (typeof response.data === 'string') {
        return response.data;
      } else if (response.data?.text) {
        return response.data.text;
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.error('Hugging Face inference error:', error);
      throw new Error(`Hugging Face inference failed: ${(error as Error).message}`);
    }
  }
} 