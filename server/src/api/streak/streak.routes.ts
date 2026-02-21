/* server/src/api/streak/streak.routes.ts */
import { Router } from 'express';
import { getStreakData, updateStreak, getStreakHistory } from './streak.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// All streak routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/streak
 * @desc    Get user's current streak and gamification data
 * @access  Private
 */
router.get('/', getStreakData);

/**
 * @route   POST /api/streak/update
 * @desc    Update streak based on meal planning activity
 * @access  Private
 */
router.post('/update', updateStreak);

/**
 * @route   GET /api/streak/history
 * @desc    Get streak history for the user
 * @access  Private
 */
router.get('/history', getStreakHistory);

export default router;
