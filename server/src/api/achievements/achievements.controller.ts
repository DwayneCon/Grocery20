/* server/src/api/achievements/achievements.controller.ts */
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { RowDataPacket } from 'mysql2';
import { logger } from '../../utils/logger.js';

interface Achievement extends RowDataPacket {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
}

interface UserAchievement extends RowDataPacket {
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  notified: boolean;
}

interface UserStats extends RowDataPacket {
  current_streak: number;
  longest_streak: number;
  meals_planned_count: number;
  weeks_under_budget: number;
  days_hit_nutrition_goals: number;
  new_recipes_tried: number;
  total_meals_planned: number;
}

/**
 * Get all achievements with user's progress
 */
export const getAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Get all achievements
  const achievements = await query<Achievement[]>(
    `SELECT * FROM achievements ORDER BY
     FIELD(tier, 'bronze', 'silver', 'gold', 'platinum'),
     requirement_value ASC`
  );

  // Get user's unlocked achievements
  const userAchievements = await query<UserAchievement[]>(
    'SELECT achievement_id, unlocked_at, progress FROM user_achievements WHERE user_id = ?',
    [userId]
  );

  // Get user's current stats for progress calculation
  const userStats = await query<UserStats[]>(
    `SELECT
      current_streak,
      longest_streak,
      meals_planned_count,
      weeks_under_budget,
      days_hit_nutrition_goals,
      new_recipes_tried,
      total_meals_planned
    FROM users
    WHERE id = ?`,
    [userId]
  );

  const stats = userStats[0] || {
    current_streak: 0,
    longest_streak: 0,
    meals_planned_count: 0,
    weeks_under_budget: 0,
    days_hit_nutrition_goals: 0,
    new_recipes_tried: 0,
    total_meals_planned: 0,
  };

  // Map unlocked achievements for quick lookup
  const unlockedMap = new Map<string, UserAchievement>();
  userAchievements.forEach((ua) => {
    unlockedMap.set(ua.achievement_id, ua);
  });

  // Calculate progress for each achievement
  const achievementsWithProgress = achievements.map((achievement) => {
    const userAchievement = unlockedMap.get(achievement.id);
    const isUnlocked = !!userAchievement;

    // Calculate current progress based on achievement type
    let currentProgress = 0;
    switch (achievement.id) {
      case 'first_meal_plan':
        currentProgress = stats.total_meals_planned > 0 ? 1 : 0;
        break;
      case 'week_streak':
        currentProgress = stats.longest_streak >= 7 ? 7 : stats.current_streak;
        break;
      case 'budget_champion':
        currentProgress = stats.weeks_under_budget;
        break;
      case 'nutrition_master':
        currentProgress = stats.days_hit_nutrition_goals;
        break;
      case 'recipe_explorer':
        currentProgress = stats.new_recipes_tried;
        break;
      case 'month_streak':
        currentProgress = stats.longest_streak >= 30 ? 30 : stats.current_streak;
        break;
      case 'century_meals':
        currentProgress = stats.total_meals_planned;
        break;
      case 'budget_pro':
        currentProgress = stats.weeks_under_budget;
        break;
      case 'health_guru':
        currentProgress = stats.days_hit_nutrition_goals;
        break;
      case 'legendary_streak':
        currentProgress = stats.longest_streak >= 100 ? 100 : stats.current_streak;
        break;
      default:
        currentProgress = 0;
    }

    return {
      ...achievement,
      unlocked: isUnlocked,
      unlockedAt: userAchievement?.unlocked_at || null,
      progress: currentProgress,
      progressPercentage: Math.min(
        100,
        Math.floor((currentProgress / achievement.requirement_value) * 100)
      ),
    };
  });

  res.json({ achievements: achievementsWithProgress });
});

/**
 * Check and unlock new achievements based on user stats
 * This should be called after significant user actions
 */
export const checkAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Get user's current stats
  const userStats = await query<UserStats[]>(
    `SELECT
      current_streak,
      longest_streak,
      meals_planned_count,
      weeks_under_budget,
      days_hit_nutrition_goals,
      new_recipes_tried,
      total_meals_planned
    FROM users
    WHERE id = ?`,
    [userId]
  );

  if (userStats.length === 0) {
    throw new AppError('User not found', 404);
  }

  const stats = userStats[0];

  // Get all achievements
  const achievements = await query<Achievement[]>('SELECT * FROM achievements');

  // Get already unlocked achievements
  const unlockedAchievements = await query<UserAchievement[]>(
    'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
    [userId]
  );

  const unlockedIds = new Set(unlockedAchievements.map((ua) => ua.achievement_id));
  const newlyUnlocked: Achievement[] = [];

  // Check each achievement
  for (const achievement of achievements) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) {
      continue;
    }

    let shouldUnlock = false;

    // Check if requirement is met
    switch (achievement.id) {
      case 'first_meal_plan':
        shouldUnlock = stats.total_meals_planned >= 1;
        break;
      case 'week_streak':
        shouldUnlock = stats.longest_streak >= 7;
        break;
      case 'budget_champion':
        shouldUnlock = stats.weeks_under_budget >= 4;
        break;
      case 'nutrition_master':
        shouldUnlock = stats.days_hit_nutrition_goals >= 30;
        break;
      case 'recipe_explorer':
        shouldUnlock = stats.new_recipes_tried >= 25;
        break;
      case 'month_streak':
        shouldUnlock = stats.longest_streak >= 30;
        break;
      case 'century_meals':
        shouldUnlock = stats.total_meals_planned >= 100;
        break;
      case 'budget_pro':
        shouldUnlock = stats.weeks_under_budget >= 12;
        break;
      case 'health_guru':
        shouldUnlock = stats.days_hit_nutrition_goals >= 100;
        break;
      case 'legendary_streak':
        shouldUnlock = stats.longest_streak >= 100;
        break;
    }

    if (shouldUnlock) {
      // Unlock the achievement
      const userAchievementId = uuidv4();
      await query(
        `INSERT INTO user_achievements (id, user_id, achievement_id, progress, notified)
         VALUES (?, ?, ?, ?, FALSE)`,
        [userAchievementId, userId, achievement.id, achievement.requirement_value]
      );

      newlyUnlocked.push(achievement);

      logger.info(`🏆 Achievement unlocked for user ${userId}: ${achievement.name}`, {
        metadata: { achievementId: achievement.id, userId },
      });
    }
  }

  res.json({
    newAchievements: newlyUnlocked,
    count: newlyUnlocked.length,
  });
});

/**
 * Mark achievement notification as seen
 */
export const markAchievementNotified = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { achievementId } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!achievementId) {
    throw new AppError('Achievement ID is required', 400);
  }

  await query(
    'UPDATE user_achievements SET notified = TRUE WHERE user_id = ? AND achievement_id = ?',
    [userId, achievementId]
  );

  res.json({ success: true });
});

/**
 * Get recently unlocked achievements (for notifications)
 */
export const getRecentAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const recentAchievements = await query<RowDataPacket[]>(
    `SELECT
      a.id,
      a.name,
      a.description,
      a.icon,
      a.tier,
      a.points,
      ua.unlocked_at,
      ua.notified
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ? AND ua.notified = FALSE
    ORDER BY ua.unlocked_at DESC`,
    [userId]
  );

  res.json({ achievements: recentAchievements });
});
