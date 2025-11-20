import express from 'express';
import {
  createMealPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
  addMeal,
  updateMeal,
  deleteMeal,
  getCurrentWeekPlan,
} from './mealPlans.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import {
  validate,
  createMealPlanSchema,
  updateMealPlanSchema,
  addMealSchema,
  updateMealSchema,
} from '../../middleware/validators.js';

const router = express.Router();

// All meal plan routes require authentication
router.use(authenticateToken);

// Meal plan management
router.post('/', validate(createMealPlanSchema), createMealPlan);
router.get('/household/:householdId', getMealPlans);
router.get('/household/:householdId/current', getCurrentWeekPlan);
router.get('/:mealPlanId', getMealPlan);
router.put('/:mealPlanId', validate(updateMealPlanSchema), updateMealPlan);
router.delete('/:mealPlanId', deleteMealPlan);

// Meal management within plans
router.post('/:mealPlanId/meals', validate(addMealSchema), addMeal);
router.put('/meals/:mealId', validate(updateMealSchema), updateMeal);
router.delete('/meals/:mealId', deleteMeal);

export default router;
