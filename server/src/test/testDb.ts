import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const dbName = process.env.DB_NAME || 'grocery_planner_test';

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  household_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  user_id CHAR(36) PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS households (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  budget_weekly DECIMAL(10,2) DEFAULT 0,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipes (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prep_time INT,
  cook_time INT,
  servings INT,
  difficulty VARCHAR(20),
  instructions JSON,
  nutrition JSON,
  tags JSON,
  image_url VARCHAR(500),
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredients (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  unit VARCHAR(50),
  average_price DECIMAL(10,2),
  nutrition JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id CHAR(36) NOT NULL,
  ingredient_id CHAR(36) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id CHAR(36) PRIMARY KEY,
  household_id CHAR(36) NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE,
  budget DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'draft',
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_plan_meals (
  id CHAR(36) PRIMARY KEY,
  meal_plan_id CHAR(36) NOT NULL,
  recipe_id CHAR(36),
  day_of_week INT,
  meal_type VARCHAR(20),
  servings INT,
  notes TEXT,
  meal_date DATE,
  estimated_cost DECIMAL(10,2),
  completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id CHAR(36) PRIMARY KEY,
  household_id CHAR(36) NOT NULL,
  meal_plan_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id CHAR(36) PRIMARY KEY,
  shopping_list_id CHAR(36) NOT NULL,
  ingredient_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  is_purchased BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

export const setupTestDatabase = async (): Promise<void> => {
  const connection = await mysql.createConnection({
    ...baseConfig,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);
  await connection.query(schemaSql);
  await connection.end();

  logger.info(`Test database ready: ${dbName}`);
};

export const teardownTestDatabase = async (): Promise<void> => {
  const connection = await mysql.createConnection(baseConfig);
  await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await connection.end();
  logger.info(`Test database dropped: ${dbName}`);
};

export const resetTestDatabase = async (): Promise<void> => {
  const connection = await mysql.createConnection({
    ...baseConfig,
    database: dbName,
  });

  const tables = [
    'shopping_list_items',
    'shopping_lists',
    'meal_plan_meals',
    'meal_plans',
    'recipe_ingredients',
    'recipes',
    'ingredients',
    'households',
    'password_reset_tokens',
    'refresh_tokens',
    'users',
  ];

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    await connection.query(`TRUNCATE TABLE \`${table}\``);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  await connection.end();
};

/**
 * Seed a test user directly into the database and return
 * a valid JWT access token for that user.
 */
export const seedTestUser = async (
  overrides?: { name?: string; email?: string; password?: string }
): Promise<{ userId: string; token: string; email: string }> => {
  const { query } = await import('../config/database.js');

  const userId = uuidv4();
  const email = overrides?.email ?? `test-${userId.slice(0, 8)}@example.com`;
  const name = overrides?.name ?? 'Test User';
  const password = overrides?.password ?? 'Test123!@';

  const passwordHash = await bcrypt.hash(password, 4); // low rounds for speed

  await query(
    'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
    [userId, name, email, passwordHash]
  );

  const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  const token = jwt.sign({ id: userId, email }, secret, { expiresIn: '1h' });

  return { userId, token, email };
};

/**
 * Seed a household for the given user and link it to the user record.
 */
export const seedTestHousehold = async (
  userId: string,
  overrides?: { name?: string; budgetWeekly?: number }
): Promise<string> => {
  const { query } = await import('../config/database.js');

  const householdId = uuidv4();
  const name = overrides?.name ?? 'Test Household';
  const budgetWeekly = overrides?.budgetWeekly ?? 100;

  await query(
    'INSERT INTO households (id, name, budget_weekly, created_by) VALUES (?, ?, ?, ?)',
    [householdId, name, budgetWeekly, userId]
  );

  await query('UPDATE users SET household_id = ? WHERE id = ?', [householdId, userId]);

  return householdId;
};
