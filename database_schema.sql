-- ================================================
-- GROCERY20 - DATABASE SCHEMA
-- ================================================
-- Run this script on your GoDaddy MySQL database
-- Created: 2025-11-26

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- PASSWORD RESET TOKENS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `used` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_token` (`token`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- HOUSEHOLDS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `households` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `owner_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- HOUSEHOLD MEMBERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `household_members` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36),
  `name` VARCHAR(255) NOT NULL,
  `age` INT,
  `dietary_restrictions` JSON,
  `preferences` JSON,
  `role` ENUM('owner', 'admin', 'member') DEFAULT 'member',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- MEAL PLANS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `meal_plans` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255),
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `budget` DECIMAL(10, 2),
  `status` ENUM('draft', 'active', 'completed') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- MEALS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `meals` (
  `id` VARCHAR(36) PRIMARY KEY,
  `meal_plan_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `meal_type` ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
  `date` DATE NOT NULL,
  `servings` INT DEFAULT 4,
  `prep_time` INT,
  `cook_time` INT,
  `ingredients` JSON,
  `instructions` JSON,
  `nutrition` JSON,
  `cost` DECIMAL(10, 2),
  `image_url` VARCHAR(500),
  `source` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plans`(`id`) ON DELETE CASCADE,
  INDEX `idx_meal_plan` (`meal_plan_id`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- RECIPES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `recipes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100),
  `cuisine` VARCHAR(100),
  `servings` INT DEFAULT 4,
  `prep_time` INT,
  `cook_time` INT,
  `difficulty` ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  `ingredients` JSON NOT NULL,
  `instructions` JSON NOT NULL,
  `nutrition` JSON,
  `tags` JSON,
  `image_url` VARCHAR(500),
  `source` VARCHAR(255),
  `rating` DECIMAL(3, 2) DEFAULT 0.00,
  `rating_count` INT DEFAULT 0,
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_category` (`category`),
  INDEX `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- RECIPE RATINGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `recipe_ratings` (
  `id` VARCHAR(36) PRIMARY KEY,
  `recipe_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `review` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_recipe` (`recipe_id`, `user_id`),
  INDEX `idx_recipe` (`recipe_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- MEAL INTERACTIONS TABLE (LIKES/DISLIKES)
-- ================================================
CREATE TABLE IF NOT EXISTS `meal_interactions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `meal_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `household_id` VARCHAR(36) NOT NULL,
  `interaction_type` ENUM('like', 'dislike') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_meal` (`meal_id`, `user_id`),
  INDEX `idx_meal` (`meal_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_household` (`household_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- SHOPPING LISTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `shopping_lists` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36) NOT NULL,
  `meal_plan_id` VARCHAR(36),
  `name` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'shopping', 'completed') DEFAULT 'pending',
  `total_cost` DECIMAL(10, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plans`(`id`) ON DELETE SET NULL,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_meal_plan` (`meal_plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- SHOPPING LIST ITEMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `shopping_list_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `shopping_list_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` VARCHAR(100),
  `category` VARCHAR(100),
  `price` DECIMAL(10, 2),
  `is_checked` BOOLEAN DEFAULT FALSE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`shopping_list_id`) REFERENCES `shopping_lists`(`id`) ON DELETE CASCADE,
  INDEX `idx_shopping_list` (`shopping_list_id`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- INVENTORY TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `inventory` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` VARCHAR(100),
  `category` VARCHAR(100),
  `location` VARCHAR(100),
  `expiration_date` DATE,
  `purchase_date` DATE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_expiration` (`expiration_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- BUDGETS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `spent` DECIMAL(10, 2) DEFAULT 0.00,
  `period` ENUM('weekly', 'monthly') DEFAULT 'weekly',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- PREFERENCES TABLE (AI Learning)
-- ================================================
CREATE TABLE IF NOT EXISTS `preferences` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36),
  `preference_type` VARCHAR(100) NOT NULL,
  `preference_data` JSON NOT NULL,
  `confidence_score` DECIMAL(3, 2) DEFAULT 0.50,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_type` (`preference_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- CONVERSATION HISTORY TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `conversation_history` (
  `id` VARCHAR(36) PRIMARY KEY,
  `household_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `role` ENUM('user', 'assistant', 'system') NOT NULL,
  `content` TEXT NOT NULL,
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_household` (`household_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- ACHIEVEMENTS TABLE (Gamification)
-- ================================================
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `household_id` VARCHAR(36) NOT NULL,
  `achievement_type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(100),
  `points` INT DEFAULT 0,
  `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_household` (`household_id`),
  INDEX `idx_type` (`achievement_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- KROGER LOCATIONS CACHE TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `kroger_locations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `location_id` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `address` JSON,
  `phone` VARCHAR(20),
  `hours` JSON,
  `departments` JSON,
  `geolocation` JSON,
  `cached_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_location_id` (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- KROGER PRODUCT CACHE TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `kroger_products` (
  `id` VARCHAR(36) PRIMARY KEY,
  `product_id` VARCHAR(100) NOT NULL,
  `location_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(255),
  `description` TEXT,
  `price` DECIMAL(10, 2),
  `sale_price` DECIMAL(10, 2),
  `size` VARCHAR(100),
  `category` VARCHAR(100),
  `image_url` VARCHAR(500),
  `upc` VARCHAR(50),
  `in_stock` BOOLEAN DEFAULT TRUE,
  `cached_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP,
  INDEX `idx_product_location` (`product_id`, `location_id`),
  INDEX `idx_category` (`category`),
  INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- ONBOARDING STATUS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS `onboarding_status` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `household_id` VARCHAR(36),
  `completed` BOOLEAN DEFAULT FALSE,
  `current_step` INT DEFAULT 0,
  `preferences_set` BOOLEAN DEFAULT FALSE,
  `first_meal_plan_created` BOOLEAN DEFAULT FALSE,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
COMMIT;

-- ================================================
-- INSERT DEFAULT DATA (Optional)
-- ================================================
-- Add any default categories, achievements, etc. here

-- ================================================
-- SCHEMA CREATION COMPLETE
-- ================================================
-- Next steps:
-- 1. Update server/.env with your database credentials
-- 2. Test connection: node -e "const mysql = require('mysql2/promise'); ..."
-- 3. Verify tables: SHOW TABLES;
-- 4. Check structure: DESCRIBE users;
