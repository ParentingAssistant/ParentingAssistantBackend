import openai from '../config/openai';
import { Story, StoryRequest } from '../types/bedtime-story';
import { AICacheService } from './ai-cache.service';
import crypto from 'crypto';

export class StoryService {
    private static instance: StoryService;
    private cacheService: AICacheService;

    private constructor() {
        this.cacheService = AICacheService.getInstance();
    }

    public static getInstance(): StoryService {
        if (!StoryService.instance) {
            StoryService.instance = new StoryService();
        }
        return StoryService.instance;
    }

    private generateCacheKey(request: StoryRequest): string {
        // Normalize the request for consistent caching
        const normalizedRequest = {
            theme: request.theme.toLowerCase().trim(),
            ageGroup: request.ageGroup?.toLowerCase().trim() || 'any',
            storyLength: request.storyLength || 'medium',
            includesMorals: request.includesMorals || false
        };
        
        return crypto
            .createHash('md5')
            .update(JSON.stringify(normalizedRequest))
            .digest('hex');
    }

    private async generateStoryWithAI(request: StoryRequest): Promise<Story> {
        const prompt = `Create a bedtime story for ${request.childName} about ${request.theme}.

Story Requirements:
- Age Group: ${request.ageGroup || 'any age'}
- Length: ${request.storyLength || 'medium'}
- Include Moral Lessons: ${request.includesMorals ? 'yes' : 'optional'}

The story should be engaging, age-appropriate, and include:
1. A creative title
2. Main characters (including ${request.childName} if possible)
3. A clear beginning, middle, and end
4. ${request.includesMorals ? 'Clear moral lessons or values' : 'Entertainment value'}

Format the response as a structured JSON object matching this interface:
{
    title: string;
    content: string;
    theme: string;
    targetAge: string;
    morals?: string[];
    characters: Array<{ name: string; role: string; }>;
    metadata: {
        length: number; // Word count
        readingTime: number; // Minutes
        difficulty: 'easy' | 'medium' | 'hard';
    }
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a creative children's story writer, skilled at crafting engaging and age-appropriate bedtime stories."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        });

        const storyResponse = JSON.parse(completion.choices[0].message.content) as Story;
        return {
            ...storyResponse,
            generatedAt: Date.now()
        };
    }

    public async generateStory(request: StoryRequest): Promise<Story> {
        const cacheKey = this.generateCacheKey(request);

        // Try to get from cache first
        const cachedResponse = await this.cacheService.getResponseByPrompt(cacheKey);
        if (cachedResponse) {
            const story = JSON.parse(cachedResponse.response) as Story;
            // Personalize the cached story with the child's name
            return this.personalizeStory(story, request.childName);
        }

        // Generate new story
        const story = await this.generateStoryWithAI(request);

        // Cache the response
        await this.cacheService.storeResponse({
            id: cacheKey,
            prompt: cacheKey,
            response: JSON.stringify(story),
            model: 'gpt-4',
            timestamp: Date.now()
        });

        return story;
    }

    private personalizeStory(story: Story, childName: string): Story {
        // Replace placeholder names with the child's name if needed
        let personalizedContent = story.content;
        const genericNames = ['the child', 'the young hero', 'the little one'];
        genericNames.forEach(name => {
            personalizedContent = personalizedContent.replace(
                new RegExp(name, 'gi'),
                childName
            );
        });

        // Update character names if they match generic names
        const personalizedCharacters = story.characters.map(character => {
            if (genericNames.includes(character.name.toLowerCase())) {
                return { ...character, name: childName };
            }
            return character;
        });

        return {
            ...story,
            content: personalizedContent,
            characters: personalizedCharacters
        };
    }
} 