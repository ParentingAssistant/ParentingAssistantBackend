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

Please provide a detailed meal plan with the following information for each meal:
- Name of the dish
- List of ingredients
- Cooking instructions
- Basic nutritional information (calories, protein, carbs, fat)

Format the response as a structured JSON object with the following properties:
- days: Array of day objects, each containing:
  - date: string (e.g., "Day 1")
  - meals: Array of meal objects, each containing:
    - name: string
    - ingredients: string[]
    - instructions: string
    - nutrition: { calories: number, protein: number, carbs: number, fat: number }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a professional nutritionist and chef specialized in creating personalized meal plans."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        });

        if (!completion.choices[0]?.message?.content) {
            throw new Error('Failed to generate meal plan: No content received from OpenAI');
        }

        const mealPlanResponse = JSON.parse(completion.choices[0].message.content) as MealPlan;
        return {
            ...mealPlanResponse,
            dietaryPreferences: request.dietaryPreferences,
            ingredients: request.ingredients,
            daysCount,
            mealsPerDay,
            generatedAt: Date.now()
        };
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