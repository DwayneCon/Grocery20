import express from 'express';
import {
  getMealPlanNutrition,
  getDayNutrition,
  compareWithGoals,
  getNutritionByMealType,
} from './nutrition.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, compareNutritionGoalsSchema } from '../../middleware/validators.js';

const router = express.Router();

// All nutrition routes require authentication
router.use(authenticateToken);

// Get meal plan nutrition summary
router.get('/meal-plan/:mealPlanId', getMealPlanNutrition);

// Get nutrition for a specific day
router.get('/meal-plan/:mealPlanId/day/:date', getDayNutrition);

// Get nutrition breakdown by meal type
router.get('/meal-plan/:mealPlanId/by-meal-type', getNutritionByMealType);

// Compare nutrition with dietary goals
router.post('/compare-goals', validate(compareNutritionGoalsSchema), compareWithGoals);

export default router;
