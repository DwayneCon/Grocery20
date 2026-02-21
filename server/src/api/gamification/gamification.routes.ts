/* server/src/api/gamification/gamification.routes.ts */
import { Router } from 'express';
import {
  getLevel,
  addXP,
  getLeaderboard,
  getHeatmap,
} from './gamification.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// All gamification routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/gamification/:userId
 * @desc    Get level, XP, progress, and next level info
 * @access  Private
 */
router.get('/:userId', getLevel);

/**
 * @route   POST /api/gamification/:userId/xp
 * @desc    Award XP for an action
 * @access  Private
 */
router.post('/:userId/xp', addXP);

/**
 * @route   GET /api/gamification/:householdId/leaderboard
 * @desc    Get household member XP leaderboard
 * @access  Private
 */
router.get('/:householdId/leaderboard', getLeaderboard);

/**
 * @route   GET /api/gamification/:userId/heatmap
 * @desc    Get cooking activity heatmap for last 365 days
 * @access  Private
 */
router.get('/:userId/heatmap', getHeatmap);

export default router;
