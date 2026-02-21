import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import {
  logMealInteraction,
  getLearnedPreferences,
  updateLearnedPreferences
} from './mealInteractions.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Log a meal interaction (swipe right/left)
router.post('/log-interaction', logMealInteraction);

// Get learned preferences for a household
router.get('/learned-preferences/:householdId', getLearnedPreferences);

// Update household preferences based on learned data
router.post('/update-preferences/:householdId', updateLearnedPreferences);

export default router;
