-- Migration: Add preference_memories table for explicit user preference tracking
-- Date: 2026-02-20
-- Description: Stores explicit preferences extracted from chat conversations
--   (e.g., "I don't like cilantro", "We love Mexican food")
--   This is different from learned_preferences which uses implicit EMA-based learning.

CREATE TABLE IF NOT EXISTS preference_memories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  household_id CHAR(36) NOT NULL,
  statement TEXT NOT NULL COMMENT 'The extracted preference statement from the user message',
  category ENUM('ingredient', 'cuisine', 'cooking_method', 'dietary', 'timing', 'budget', 'general') NOT NULL,
  sentiment ENUM('positive', 'negative', 'neutral') NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.80 COMMENT 'Confidence that this is a real preference (0.00-1.00)',
  source_message TEXT COMMENT 'The original user message the preference was extracted from',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  INDEX idx_pm_household (household_id),
  INDEX idx_pm_category (category),
  INDEX idx_pm_sentiment (sentiment),
  INDEX idx_pm_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
