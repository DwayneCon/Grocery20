-- Migration: Create achievements definition table
-- Created: 2025-11-25

-- Create achievements table to store achievement metadata
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(50) PRIMARY KEY COMMENT 'Achievement identifier (e.g., first_meal_plan)',
  name VARCHAR(255) NOT NULL COMMENT 'Display name of the achievement',
  description TEXT NOT NULL COMMENT 'Description of how to unlock',
  icon VARCHAR(50) NOT NULL COMMENT 'Icon identifier (emoji or icon name)',
  category VARCHAR(50) NOT NULL COMMENT 'Category: streak, budget, nutrition, exploration, social',
  tier VARCHAR(20) NOT NULL COMMENT 'Tier: bronze, silver, gold, platinum',
  requirement_type VARCHAR(50) NOT NULL COMMENT 'Type of requirement: count, streak, milestone',
  requirement_value INT NOT NULL COMMENT 'Value needed to unlock (e.g., 7 for 7-day streak)',
  points INT DEFAULT 10 COMMENT 'Points awarded for unlocking',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for queries
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_tier ON achievements(tier);

-- Insert initial 10 achievements
INSERT INTO achievements (id, name, description, icon, category, tier, requirement_type, requirement_value, points) VALUES
('first_meal_plan', 'First Steps', 'Create your first meal plan', '🎯', 'exploration', 'bronze', 'count', 1, 10),
('week_streak', 'Week Warrior', 'Plan meals for 7 days in a row', '🔥', 'streak', 'bronze', 'streak', 7, 25),
('budget_champion', 'Budget Champion', 'Stay under budget for 4 weeks', '💰', 'budget', 'silver', 'count', 4, 50),
('nutrition_master', 'Nutrition Master', 'Hit nutrition goals for 30 days', '🥗', 'nutrition', 'gold', 'count', 30, 100),
('recipe_explorer', 'Recipe Explorer', 'Try 25 new recipes', '👨‍🍳', 'exploration', 'silver', 'count', 25, 50),
('month_streak', 'Consistency King', 'Maintain 30-day meal planning streak', '👑', 'streak', 'gold', 'streak', 30, 100),
('century_meals', 'Century Club', 'Plan 100 total meals', '💯', 'exploration', 'gold', 'milestone', 100, 100),
('budget_pro', 'Budget Pro', 'Stay under budget for 12 weeks', '🏆', 'budget', 'gold', 'count', 12, 100),
('health_guru', 'Health Guru', 'Hit nutrition goals for 100 days', '🌟', 'nutrition', 'platinum', 'count', 100, 200),
('legendary_streak', 'Legendary Planner', 'Maintain 100-day streak', '⭐', 'streak', 'platinum', 'streak', 100, 200);

-- Create user_achievements table to track unlock timestamps and progress
CREATE TABLE IF NOT EXISTS user_achievements (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  achievement_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INT DEFAULT 0 COMMENT 'Current progress toward achievement',
  notified BOOLEAN DEFAULT FALSE COMMENT 'Whether user was notified of unlock',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, unlocked_at DESC);
CREATE INDEX idx_user_achievements_notified ON user_achievements(user_id, notified);
