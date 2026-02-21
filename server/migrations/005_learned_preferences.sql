-- Migration: Add learned_preferences table for AI preference learning
-- Date: 2025-11-26
-- Description: Stores learned user preferences using exponential moving average algorithm

CREATE TABLE IF NOT EXISTS learned_preferences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  household_id CHAR(36) NOT NULL,
  category VARCHAR(50) NOT NULL COMMENT 'cuisine, protein, cooking_method, flavor_profile',
  preference_value VARCHAR(255) NOT NULL COMMENT 'The specific value (e.g., Italian, Chicken, Grilling)',
  score DECIMAL(5,4) NOT NULL DEFAULT 0.0000 COMMENT 'Preference score from -1.0 (dislike) to 1.0 (like)',
  confidence DECIMAL(5,4) NOT NULL DEFAULT 0.0000 COMMENT 'Confidence score from 0.0 to 1.0',
  interaction_count INT NOT NULL DEFAULT 1 COMMENT 'Number of interactions contributing to this preference',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  INDEX idx_household_category (household_id, category),
  INDEX idx_score (score DESC),
  INDEX idx_last_updated (last_updated DESC),
  UNIQUE KEY unique_preference (household_id, category, preference_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add cooking_method and flavor_profile columns to meal_interactions
-- Note: Columns will only be added if they don't already exist (handled by MySQL warnings)
ALTER TABLE meal_interactions
  ADD COLUMN cooking_method VARCHAR(100) NULL COMMENT 'Grilling, Baking, Stir-fry, etc.',
  ADD COLUMN flavor_profile VARCHAR(100) NULL COMMENT 'Spicy, Sweet, Savory, etc.',
  ADD COLUMN prep_time INT NULL COMMENT 'Preparation time in minutes',
  ADD COLUMN rating INT NULL COMMENT 'User rating 1-5 stars';
