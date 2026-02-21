/* server/src/api/streak/streak.controller.ts */
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { RowDataPacket } from 'mysql2';

interface UserStreakData extends RowDataPacket {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  meals_planned_count: number;
  weeks_under_budget: number;
  days_hit_nutrition_goals: number;
  new_recipes_tried: number;
  total_meals_planned: number;
  unlocked_achievements: string | null;
}

/**
 * Get user's current streak and gamification data
 */
export const getStreakData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Get streak data from users table
  const users = await query<UserStreakData[]>(
    `SELECT
      current_streak,
      longest_streak,
      last_activity_date,
      meals_planned_count,
      weeks_under_budget,
      days_hit_nutrition_goals,
      new_recipes_tried,
      total_meals_planned,
      unlocked_achievements
    FROM users
    WHERE id = ?`,
    [userId]
  );

  if (users.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = users[0];

  // Parse unlocked achievements from JSON
  let unlockedAchievements: string[] = [];
  if (user.unlocked_achievements) {
    try {
      unlockedAchievements = JSON.parse(user.unlocked_achievements);
    } catch (error) {
      console.error('Failed to parse unlocked achievements:', error);
    }
  }

  res.json({
    currentStreak: user.current_streak || 0,
    longestStreak: user.longest_streak || 0,
    lastActivityDate: user.last_activity_date,
    stats: {
      mealsPlannedCount: user.meals_planned_count || 0,
      weeksUnderBudget: user.weeks_under_budget || 0,
      daysHitNutritionGoals: user.days_hit_nutrition_goals || 0,
      newRecipesTried: user.new_recipes_tried || 0,
      totalMealsPlanned: user.total_meals_planned || 0,
    },
    unlockedAchievements,
  });
});

/**
 * Update streak based on meal planning activity
 * This should be called whenever a user plans a meal
 */
export const updateStreak = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Get current streak data
  const users = await query<UserStreakData[]>(
    'SELECT current_streak, longest_streak, last_activity_date FROM users WHERE id = ?',
    [userId]
  );

  if (users.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = users[0];
  let newStreak = user.current_streak || 0;
  let newLongestStreak = user.longest_streak || 0;

  // Check if user already logged activity today
  const todayActivity = await query<RowDataPacket[]>(
    'SELECT id FROM streak_history WHERE user_id = ? AND activity_date = ?',
    [userId, today]
  );

  if (todayActivity.length === 0) {
    // New activity for today
    const lastActivityDate = user.last_activity_date;

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const currentDate = new Date(today);
      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = (user.current_streak || 0) + 1;
      } else if (diffDays > 1) {
        // Streak broken - reset to 1
        newStreak = 1;
      }
      // diffDays === 0 means same day (shouldn't happen due to check above)
    } else {
      // First activity ever
      newStreak = 1;
    }

    // Update longest streak if needed
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    // Update user streak data
    await query(
      `UPDATE users
       SET current_streak = ?,
           longest_streak = ?,
           last_activity_date = ?,
           streak_updated_at = NOW()
       WHERE id = ?`,
      [newStreak, newLongestStreak, today, userId]
    );

    // Log activity in streak_history
    const activityId = uuidv4();
    await query(
      `INSERT INTO streak_history
       (id, user_id, activity_date, meals_planned_count)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
       meals_planned_count = meals_planned_count + 1`,
      [activityId, userId, today]
    );
  }

  res.json({
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastActivityDate: today,
  });
});

/**
 * Get streak history for the user
 */
export const getStreakHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const limit = parseInt(req.query.limit as string) || 30;

  const history = await query<RowDataPacket[]>(
    `SELECT
      activity_date,
      meals_planned_count,
      budget_stayed_under,
      nutrition_goals_met
    FROM streak_history
    WHERE user_id = ?
    ORDER BY activity_date DESC
    LIMIT ?`,
    [userId, limit]
  );

  res.json({ history });
});
