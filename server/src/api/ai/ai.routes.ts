import express from 'express';
import { chat, generateMealPlan, getStats, clearHistory } from './ai.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, chatSchema, aiMealPlanSchema } from '../../middleware/validators.js';

const router = express.Router();

// All AI routes require authentication
router.use(authenticateToken);

// Chat endpoint with history
router.post('/chat', validate(chatSchema), chat);

// Generate meal plan
router.post('/meal-plan', validate(aiMealPlanSchema), generateMealPlan);

// Conversation history management
router.get('/history/stats', getStats);
router.delete('/history', clearHistory);

export default router;
