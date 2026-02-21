/* client/src/services/streakService.ts */
import apiClient from '../utils/apiClient';
import { logger } from '../utils/logger';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  stats: {
    mealsPlannedCount: number;
    weeksUnderBudget: number;
    daysHitNutritionGoals: number;
    newRecipesTried: number;
    totalMealsPlanned: number;
  };
  unlockedAchievements: string[];
}

export interface StreakUpdateResponse {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

export interface StreakHistoryEntry {
  activity_date: string;
  meals_planned_count: number;
  budget_stayed_under: boolean;
  nutrition_goals_met: boolean;
}

class StreakService {
  /**
   * Get current streak and gamification data for the user
   */
  async getStreakData(): Promise<StreakData> {
    try {
      const response = await apiClient.get('/streak');
      logger.info('Fetched streak data', { metadata: response.data });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch streak data', error);
      throw error;
    }
  }

  /**
   * Update streak based on meal planning activity
   * Call this whenever a user plans a meal
   */
  async updateStreak(): Promise<StreakUpdateResponse> {
    try {
      const response = await apiClient.post('/streak/update');
      logger.info('Updated streak', { metadata: response.data });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to update streak', error);
      throw error;
    }
  }

  /**
   * Get streak history for the user
   * @param limit - Number of days to fetch (default: 30)
   */
  async getStreakHistory(limit: number = 30): Promise<StreakHistoryEntry[]> {
    try {
      const response = await apiClient.get(`/streak/history?limit=${limit}`);
      logger.info('Fetched streak history', {
        metadata: { count: response.data.history.length },
      });
      return response.data.history;
    } catch (error: any) {
      logger.error('Failed to fetch streak history', error);
      throw error;
    }
  }
}

export const streakService = new StreakService();
