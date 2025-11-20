-- AI Grocery Planner Database Schema
-- Created for MySQL 8.0+

-- Drop tables if they exist (for development)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS shopping_list_items;
DROP TABLE IF EXISTS shopping_lists;
DROP TABLE IF EXISTS meal_plan_meals;
DROP TABLE IF EXISTS meal_plans;
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS household_members;
DROP TABLE IF EXISTS dietary_preferences;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    household_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_household_id (household_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Households table
CREATE TABLE households (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    budget_weekly DECIMAL(10,2) DEFAULT 0,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Household members table
CREATE TABLE household_members (
    id CHAR(36) PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    dietary_restrictions JSON,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household_id (household_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dietary preferences table
CREATE TABLE dietary_preferences (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    household_id CHAR(36),
    preference_type ENUM('allergy', 'intolerance', 'preference', 'restriction') NOT NULL,
    item VARCHAR(255) NOT NULL,
    severity INT DEFAULT 5 COMMENT '1-10 scale, 10 being most severe',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_household_id (household_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipes table
CREATE TABLE recipes (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prep_time INT COMMENT 'Minutes',
    cook_time INT COMMENT 'Minutes',
    servings INT DEFAULT 4,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    instructions JSON COMMENT 'Array of step objects',
    nutrition JSON COMMENT 'Nutrition information',
    tags JSON COMMENT 'Array of tags',
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    source VARCHAR(255),
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FULLTEXT INDEX idx_recipe_search (name, description),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ingredients table
CREATE TABLE ingredients (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) COMMENT 'Produce, Meat, Dairy, etc.',
    unit VARCHAR(50) COMMENT 'Default unit of measurement',
    average_price DECIMAL(10,2),
    nutrition JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe ingredients junction table
CREATE TABLE recipe_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id CHAR(36) NOT NULL,
    ingredient_id CHAR(36) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    INDEX idx_recipe_id (recipe_id),
    INDEX idx_ingredient_id (ingredient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meal plans table
CREATE TABLE meal_plans (
    id CHAR(36) PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status ENUM('draft', 'approved', 'completed') DEFAULT 'draft',
    total_cost DECIMAL(10,2) DEFAULT 0,
    ai_generated BOOLEAN DEFAULT FALSE,
    preferences JSON COMMENT 'Meal plan generation preferences',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household_id (household_id),
    INDEX idx_week_start (week_start),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meal plan meals table
CREATE TABLE meal_plan_meals (
    id CHAR(36) PRIMARY KEY,
    meal_plan_id CHAR(36) NOT NULL,
    recipe_id CHAR(36),
    meal_date DATE NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    servings INT DEFAULT 4,
    notes TEXT,
    estimated_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
    INDEX idx_meal_plan_id (meal_plan_id),
    INDEX idx_meal_date (meal_date),
    INDEX idx_meal_type (meal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping lists table
CREATE TABLE shopping_lists (
    id CHAR(36) PRIMARY KEY,
    meal_plan_id CHAR(36),
    household_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    total_cost DECIMAL(10,2) DEFAULT 0,
    store_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_meal_plan_id (meal_plan_id),
    INDEX idx_household_id (household_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping list items table
CREATE TABLE shopping_list_items (
    id CHAR(36) PRIMARY KEY,
    shopping_list_id CHAR(36) NOT NULL,
    ingredient_id CHAR(36),
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    estimated_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    is_purchased BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL,
    INDEX idx_shopping_list_id (shopping_list_id),
    INDEX idx_category (category),
    INDEX idx_is_purchased (is_purchased)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update users table to add foreign key for household_id
ALTER TABLE users
ADD CONSTRAINT fk_users_household
FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL;

-- Create views for common queries

-- View for meal plans with household info
CREATE VIEW v_meal_plans_with_household AS
SELECT
    mp.*,
    h.name as household_name,
    h.budget_weekly
FROM meal_plans mp
JOIN households h ON mp.household_id = h.id;

-- View for shopping lists with item counts
CREATE VIEW v_shopping_lists_summary AS
SELECT
    sl.*,
    COUNT(sli.id) as total_items,
    SUM(CASE WHEN sli.is_purchased = TRUE THEN 1 ELSE 0 END) as purchased_items
FROM shopping_lists sl
LEFT JOIN shopping_list_items sli ON sl.id = sli.shopping_list_id
GROUP BY sl.id;

-- Indexes for performance optimization
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);
CREATE INDEX idx_meal_plans_created_at ON meal_plans(created_at);

-- Success message
SELECT 'Database schema created successfully!' as message;
