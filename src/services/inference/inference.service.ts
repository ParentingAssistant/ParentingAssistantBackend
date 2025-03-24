import { OpenAIProvider } from './providers/openai.provider';
import { HuggingFaceProvider } from './providers/huggingface.provider';
import { TogetherAIProvider } from './providers/togetherai.provider';

export type InferenceOptions = {
  provider?: 'openai' | 'huggingface' | 'togetherai';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
};

export class InferenceService {
  private static instance: InferenceService;
  private openaiProvider: OpenAIProvider;
  private huggingfaceProvider: HuggingFaceProvider;
  private togetheraiProvider: TogetherAIProvider;

  private constructor() {
    this.openaiProvider = new OpenAIProvider();
    this.huggingfaceProvider = new HuggingFaceProvider();
    this.togetheraiProvider = new TogetherAIProvider();
  }

  public static getInstance(): InferenceService {
    if (!InferenceService.instance) {
      InferenceService.instance = new InferenceService();
    }
    return InferenceService.instance;
  }

  public async runInference(prompt: string, options: InferenceOptions = {}): Promise<string> {
    const provider = options.provider || 'openai';

    switch (provider) {
      case 'openai':
        return this.openaiProvider.runInference(prompt, options);
      case 'huggingface':
        return this.huggingfaceProvider.runInference(prompt, options);
      case 'togetherai':
        return this.togetheraiProvider.runInference(prompt, options);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
} 