import openai from '../../../config/openai';
import { InferenceOptions } from '../inference.service';

export class OpenAIProvider {
  public async runInference(prompt: string, options: InferenceOptions = {}): Promise<string> {
    try {
      const model = options.model || 'gpt-4';
      const temperature = options.temperature ?? 0.7;
      const maxTokens = options.maxTokens ?? 1000;

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide clear and concise responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('Failed to generate content: No content received from OpenAI');
      }

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI inference error:', error);
      throw new Error(`OpenAI inference failed: ${(error as Error).message}`);
    }
  }
} 