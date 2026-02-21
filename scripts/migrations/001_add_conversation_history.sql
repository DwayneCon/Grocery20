-- Migration: Add conversation history and additional missing tables
-- Created: 2025-11-21

-- Conversation history table for AI chat persistence
CREATE TABLE IF NOT EXISTS conversation_history (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    household_id CHAR(36),
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    model VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_household_id (household_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores AI conversation history for context persistence';

-- Recipe ratings and reviews table
CREATE TABLE IF NOT EXISTS recipe_ratings (
    id CHAR(36) PRIMARY KEY,
    recipe_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    images JSON COMMENT 'Array of user-uploaded image URLs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_recipe_rating (user_id, recipe_id),
    INDEX idx_recipe_id (recipe_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User ratings and reviews for recipes';

-- Inventory/Pantry tracking table
CREATE TABLE IF NOT EXISTS inventory_items (
    id CHAR(36) PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    ingredient_id CHAR(36),
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    purchase_date DATE,
    expiration_date DATE,
    location VARCHAR(100) COMMENT 'Fridge, Pantry, Freezer',
    status ENUM('fresh', 'expiring_soon', 'expired') DEFAULT 'fresh',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL,
    INDEX idx_household_id (household_id),
    INDEX idx_expiration_date (expiration_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Track household pantry and refrigerator inventory';

-- Budget tracking table
CREATE TABLE IF NOT EXISTS budget_tracking (
    id CHAR(36) PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    budget_allocated DECIMAL(10,2) NOT NULL,
    amount_spent DECIMAL(10,2) DEFAULT 0,
    amount_saved DECIMAL(10,2) DEFAULT 0,
    deals_used INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household_id (household_id),
    INDEX idx_week_start (week_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Track weekly budget spending and savings';

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    theme ENUM('light', 'dark', 'auto') DEFAULT 'dark',
    font_size ENUM('small', 'medium', 'large') DEFAULT 'medium',
    reduced_motion BOOLEAN DEFAULT FALSE,
    high_contrast BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    preferred_stores JSON COMMENT 'Array of preferred store names',
    ai_conversation_style ENUM('casual', 'professional', 'technical') DEFAULT 'casual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User UI and experience preferences';

-- Store products table (for price tracking)
CREATE TABLE IF NOT EXISTS store_products (
    id CHAR(36) PRIMARY KEY,
    ingredient_id CHAR(36),
    store_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(10,2),
    on_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10,2),
    last_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    url VARCHAR(500),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL,
    INDEX idx_ingredient_id (ingredient_id),
    INDEX idx_store_name (store_name),
    INDEX idx_on_sale (on_sale),
    INDEX idx_last_scraped (last_scraped)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Track product prices across different stores';

-- Create view for average recipe ratings
CREATE OR REPLACE VIEW v_recipe_ratings_summary AS
SELECT
    r.id as recipe_id,
    r.name as recipe_name,
    COUNT(rr.id) as total_ratings,
    AVG(rr.rating) as average_rating,
    SUM(CASE WHEN rr.rating = 5 THEN 1 ELSE 0 END) as five_star_count,
    SUM(CASE WHEN rr.rating = 4 THEN 1 ELSE 0 END) as four_star_count,
    SUM(CASE WHEN rr.rating = 3 THEN 1 ELSE 0 END) as three_star_count,
    SUM(CASE WHEN rr.rating = 2 THEN 1 ELSE 0 END) as two_star_count,
    SUM(CASE WHEN rr.rating = 1 THEN 1 ELSE 0 END) as one_star_count
FROM recipes r
LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
GROUP BY r.id;

-- Create view for inventory expiring soon (within 3 days)
CREATE OR REPLACE VIEW v_inventory_expiring_soon AS
SELECT
    ii.*,
    DATEDIFF(ii.expiration_date, CURDATE()) as days_until_expiration
FROM inventory_items ii
WHERE ii.expiration_date IS NOT NULL
  AND ii.expiration_date >= CURDATE()
  AND ii.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
  AND ii.status != 'expired'
ORDER BY ii.expiration_date ASC;

-- Create view for budget tracking summary
CREATE OR REPLACE VIEW v_budget_summary AS
SELECT
    bt.*,
    h.name as household_name,
    (bt.budget_allocated - bt.amount_spent) as remaining_budget,
    ROUND((bt.amount_spent / bt.budget_allocated) * 100, 2) as budget_used_percentage
FROM budget_tracking bt
JOIN households h ON bt.household_id = h.id;

SELECT 'Migration 001 completed successfully!' as message;
