/* server/src/api/gamification/gamification.controller.ts */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import {
  getUserLevel,
  awardXP,
  getHouseholdLeaderboard,
  getCookingHeatmap,
  LEVELS,
  XP_ACTIONS,
  XPAction,
} from '../../services/gamification/levelSystem.js';

/**
 * GET /api/gamification/:userId
 * Get level, XP, progress, and next level info for a user.
 */
export const getLevel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  if (!requestingUserId) {
    throw new AppError('User not authenticated', 401);
  }

  // Users can only view their own gamification data
  if (userId !== requestingUserId) {
    throw new AppError('Not authorized to view this user\'s level', 403);
  }

  const levelInfo = await getUserLevel(userId);

  res.json({
    ...levelInfo,
    allLevels: LEVELS,
  });
});

/**
 * POST /api/gamification/:userId/xp
 * Award XP for a specific action.
 * Body: { action: string }
 */
export const addXP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { action } = req.body;
  const requestingUserId = req.user?.id;

  if (!requestingUserId) {
    throw new AppError('User not authenticated', 401);
  }

  if (userId !== requestingUserId) {
    throw new AppError('Not authorized to award XP for this user', 403);
  }

  if (!action) {
    throw new AppError('Action is required', 400);
  }

  // Validate the action is a known XP action
  if (!(action in XP_ACTIONS)) {
    throw new AppError(
      `Invalid action. Must be one of: ${Object.keys(XP_ACTIONS).join(', ')}`,
      400
    );
  }

  const result = await awardXP(userId, action as XPAction);

  res.json({
    success: true,
    ...result,
  });
});

/**
 * GET /api/gamification/:householdId/leaderboard
 * Get ranked household member XP standings.
 */
export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const requestingUserId = req.user?.id;

  if (!requestingUserId) {
    throw new AppError('User not authenticated', 401);
  }

  const leaderboard = await getHouseholdLeaderboard(String(householdId));

  res.json({
    householdId,
    leaderboard,
  });
});

/**
 * GET /api/gamification/:userId/heatmap
 * Get cooking activity for the last 365 days.
 */
export const getHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  if (!requestingUserId) {
    throw new AppError('User not authenticated', 401);
  }

  if (userId !== requestingUserId) {
    throw new AppError('Not authorized to view this user\'s heatmap', 403);
  }

  const heatmapData = await getCookingHeatmap(userId);

  res.json({
    userId,
    heatmap: heatmapData,
  });
});
