/* client/src/services/achievementService.ts */
import apiClient from '../utils/apiClient';
import { logger } from '../utils/logger';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'budget' | 'nutrition' | 'exploration' | 'social';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement_type: string;
  requirement_value: number;
  points: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressPercentage: number;
}

export interface CheckAchievementsResponse {
  newAchievements: Achievement[];
  count: number;
}

export interface RecentAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  points: number;
  unlocked_at: string;
  notified: boolean;
}

class AchievementService {
  /**
   * Get all achievements with user's progress
   */
  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiClient.get('/achievements');
      logger.info('Fetched achievements', { metadata: response.data });
      return response.data.achievements;
    } catch (error: any) {
      logger.error('Failed to fetch achievements', error);
      throw error;
    }
  }

  /**
   * Check and unlock new achievements based on user stats
   */
  async checkAchievements(): Promise<CheckAchievementsResponse> {
    try {
      const response = await apiClient.post('/achievements/check');
      logger.info('Checked achievements', { metadata: response.data });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to check achievements', error);
      throw error;
    }
  }

  /**
   * Get recently unlocked achievements (for notifications)
   */
  async getRecentAchievements(): Promise<RecentAchievement[]> {
    try {
      const response = await apiClient.get('/achievements/recent');
      logger.info('Fetched recent achievements', { metadata: response.data });
      return response.data.achievements;
    } catch (error: any) {
      logger.error('Failed to fetch recent achievements', error);
      throw error;
    }
  }

  /**
   * Mark achievement notification as seen
   */
  async markAchievementNotified(achievementId: string): Promise<void> {
    try {
      await apiClient.post('/achievements/notify', { achievementId });
      logger.info('Marked achievement as notified', { metadata: { achievementId } });
    } catch (error: any) {
      logger.error('Failed to mark achievement as notified', error);
      throw error;
    }
  }
}

export const achievementService = new AchievementService();
