export interface MealPlanRequest {
    dietaryPreferences: string[];
    ingredients: string[];
    daysCount?: number;
    mealsPerDay?: number;
}

export interface Meal {
    name: string;
    ingredients: string[];
    instructions: string;
    nutritionalInfo?: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
    };
}

export interface DailyPlan {
    day: number;
    meals: Meal[];
}

export interface MealPlan {
    id?: string;
    dietaryPreferences: string[];
    ingredients: string[];
    daysCount: number;
    mealsPerDay: number;
    plan: DailyPlan[];
    generatedAt: number;
} 