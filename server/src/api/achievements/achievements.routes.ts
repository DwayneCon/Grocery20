/* server/src/api/achievements/achievements.routes.ts */
import { Router } from 'express';
import {
  getAchievements,
  checkAchievements,
  markAchievementNotified,
  getRecentAchievements,
} from './achievements.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// All achievement routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/achievements
 * @desc    Get all achievements with user's progress
 * @access  Private
 */
router.get('/', getAchievements);

/**
 * @route   POST /api/achievements/check
 * @desc    Check and unlock new achievements based on user stats
 * @access  Private
 */
router.post('/check', checkAchievements);

/**
 * @route   GET /api/achievements/recent
 * @desc    Get recently unlocked achievements (for notifications)
 * @access  Private
 */
router.get('/recent', getRecentAchievements);

/**
 * @route   POST /api/achievements/notify
 * @desc    Mark achievement notification as seen
 * @access  Private
 */
router.post('/notify', markAchievementNotified);

export default router;
