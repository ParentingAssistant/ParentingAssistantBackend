import { Router } from 'express';
import { MealPlanService } from '../services/meal-plan.service';
import { MealPlanRequest } from '../types/meal-plan';
import { authenticateUser } from '../middleware/auth.middleware';
import { aiLimiter } from '../config/security';

const router = Router();
const mealPlanService = MealPlanService.getInstance();

router.post('/generate-meal-plan',
    authenticateUser,
    aiLimiter,
    async (req, res) => {
        try {
            const request: MealPlanRequest = {
                dietaryPreferences: req.body.dietaryPreferences || [],
                ingredients: req.body.ingredients || [],
                daysCount: req.body.daysCount,
                mealsPerDay: req.body.mealsPerDay
            };

            // Validate request
            if (!Array.isArray(request.dietaryPreferences) || !Array.isArray(request.ingredients)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'dietaryPreferences and ingredients must be arrays'
                });
            }

            const mealPlan = await mealPlanService.generateMealPlan(request);
            
            res.json({
                status: 'success',
                data: mealPlan
            });
        } catch (error) {
            console.error('Error generating meal plan:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error generating meal plan'
            });
        }
    }
);

export default router; 