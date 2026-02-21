-- ================================================
-- MIGRATION 020: Full Schema Alignment (Actual Fixes)
-- Only adds genuinely missing columns for controller compatibility
-- ================================================

-- Helper procedure for safe column additions (MySQL doesn't support ADD IF NOT EXISTS)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS add_column_if_not_exists(
  IN tbl VARCHAR(64), IN col VARCHAR(64), IN col_def VARCHAR(512)
)
BEGIN
  SET @col_exists = 0;
  SELECT COUNT(*) INTO @col_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col;
  IF @col_exists = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- Add cuisine column to recipes (controller filters by it)
CALL add_column_if_not_exists('recipes', 'cuisine', 'VARCHAR(100) DEFAULT NULL AFTER `difficulty`');

-- Add created_by to meal_plans (controller tracks who created plans)
CALL add_column_if_not_exists('meal_plans', 'created_by', 'VARCHAR(36) DEFAULT NULL');

-- Add budget to meal_plans (controller uses it in create/update)
CALL add_column_if_not_exists('meal_plans', 'budget', 'DECIMAL(10,2) DEFAULT NULL');

-- Clean up
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
