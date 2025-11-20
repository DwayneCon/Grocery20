import express from 'express';
import { chat, generateMealPlan } from './ai.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, chatSchema, aiMealPlanSchema } from '../../middleware/validators.js';

const router = express.Router();

// All AI routes require authentication
router.use(authenticateToken);

// Chat endpoint
router.post('/chat', validate(chatSchema), chat);

// Generate meal plan
router.post('/meal-plan', validate(aiMealPlanSchema), generateMealPlan);

export default router;
