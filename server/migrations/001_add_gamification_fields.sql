-- Migration: Add gamification and streak tracking fields to users table
-- Created: 2025-11-25

-- Add streak tracking fields
ALTER TABLE users
ADD COLUMN current_streak INT DEFAULT 0 COMMENT 'Current consecutive days with meal planning activity',
ADD COLUMN longest_streak INT DEFAULT 0 COMMENT 'Longest streak achieved',
ADD COLUMN last_activity_date DATE COMMENT 'Last date user had meal planning activity',
ADD COLUMN streak_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Last time streak was updated';

-- Add achievement tracking fields
ALTER TABLE users
ADD COLUMN meals_planned_count INT DEFAULT 0 COMMENT 'Total number of individual meals planned',
ADD COLUMN weeks_under_budget INT DEFAULT 0 COMMENT 'Number of weeks user stayed under budget',
ADD COLUMN days_hit_nutrition_goals INT DEFAULT 0 COMMENT 'Number of days user hit all nutrition goals',
ADD COLUMN new_recipes_tried INT DEFAULT 0 COMMENT 'Number of new/unique recipes tried',
ADD COLUMN total_meals_planned INT DEFAULT 0 COMMENT 'Total meals ever planned',
ADD COLUMN unlocked_achievements JSON COMMENT 'Array of unlocked achievement IDs';

-- Create index for performance
CREATE INDEX idx_users_streak ON users(current_streak DESC, longest_streak DESC);
CREATE INDEX idx_users_last_activity ON users(last_activity_date);

-- Create streak_history table to track daily activity
CREATE TABLE IF NOT EXISTS streak_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  activity_date DATE NOT NULL,
  meals_planned_count INT DEFAULT 0,
  budget_stayed_under BOOLEAN DEFAULT FALSE,
  nutrition_goals_met BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for streak calculations
CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON streak_history(user_id, activity_date DESC);
