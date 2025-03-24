import openai from '../config/openai';
import { MealPlan, MealPlanRequest } from '../types/meal-plan';
import { AICacheService } from './ai-cache.service';
import crypto from 'crypto';

export class MealPlanService {
    private static instance: MealPlanService;
    private cacheService: AICacheService;

    private constructor() {
        this.cacheService = AICacheService.getInstance();
    }

    public static getInstance(): MealPlanService {
        if (!MealPlanService.instance) {
            MealPlanService.instance = new MealPlanService();
        }
        return MealPlanService.instance;
    }

    private generateCacheKey(request: MealPlanRequest): string {
        const normalizedRequest = {
            ...request,
            dietaryPreferences: [...request.dietaryPreferences].sort(),
            ingredients: [...request.ingredients].sort(),
            daysCount: request.daysCount || 7,
            mealsPerDay: request.mealsPerDay || 3
        };
        
        return crypto
            .createHash('md5')
            .update(JSON.stringify(normalizedRequest))
            .digest('hex');
    }

    private async generateMealPlanWithAI(request: MealPlanRequest): Promise<MealPlan> {
        const daysCount = request.daysCount || 7;
        const mealsPerDay = request.mealsPerDay || 3;

        const prompt = `Generate a ${daysCount}-day meal plan with ${mealsPerDay} meals per day.
Dietary preferences: ${request.dietaryPreferences.join(', ')}
Available ingredients: ${request.ingredients.join(', ')}

IMPORTANT: Format your response as a valid JSON object with the following structure:
{
    "days": [
        {
            "date": "Day 1",
            "meals": [
                {
                    "name": "Meal Name",
                    "ingredients": ["ingredient 1", "ingredient 2"],
                    "instructions": "Cooking instructions...",
                    "nutrition": {
                        "calories": 500,
                        "protein": 20,
                        "carbs": 60,
                        "fat": 15
                    }
                }
            ]
        }
    ]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a professional nutritionist and chef specialized in creating personalized meal plans. Always respond with valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        if (!completion.choices[0]?.message?.content) {
            throw new Error('Failed to generate meal plan: No content received from OpenAI');
        }

        try {
            const mealPlanResponse = JSON.parse(completion.choices[0].message.content) as MealPlan;
            return {
                ...mealPlanResponse,
                dietaryPreferences: request.dietaryPreferences,
                ingredients: request.ingredients,
                daysCount,
                mealsPerDay,
                generatedAt: Date.now()
            };
        } catch (error) {
            console.error('Error parsing meal plan response:', error);
            throw new Error('Failed to parse meal plan response from OpenAI');
        }
    }

    public async generateMealPlan(request: MealPlanRequest): Promise<MealPlan> {
        const cacheKey = this.generateCacheKey(request);

        // Try to get from cache first
        const cachedResponse = await this.cacheService.getResponse(cacheKey);
        if (cachedResponse && cachedResponse.response) {
            return JSON.parse(cachedResponse.response) as MealPlan;
        }

        // Generate new meal plan
        const mealPlan = await this.generateMealPlanWithAI(request);

        // Cache the response
        await this.cacheService.storeResponse({
            id: cacheKey,
            prompt: cacheKey,
            response: JSON.stringify(mealPlan),
            model: 'gpt-4',
            timestamp: Date.now()
        });

        return mealPlan;
    }
} 