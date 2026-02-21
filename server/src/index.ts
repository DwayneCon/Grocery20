import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { testConnection } from './config/database.js';
import { validateEnv } from './config/env.js';
import config from './config/env.js';
import {
  securityHeaders,
  rateLimiter,
  sanitizeInput,
  corsOptions,
} from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';

// Initialize Sentry error monitoring
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.nodeEnv,
    tracesSampleRate: 0.2,
  });
}

// Import routes
import authRoutes from './api/auth/auth.routes.js';
import aiRoutes from './api/ai/ai.routes.js';
import householdRoutes from './api/households/households.routes.js';
import recipeRoutes from './api/meals/recipes.routes.js';
import mealPlanRoutes from './api/meals/mealPlans.routes.js';
import mealInteractionsRoutes from './api/meals/mealInteractions.routes.js';
import shoppingRoutes from './api/shopping/shopping.routes.js';
import budgetRoutes from './api/budget/budget.routes.js';
import nutritionRoutes from './api/nutrition/nutrition.routes.js';
import inventoryRoutes from './api/inventory/inventory.routes.js';
import storesRoutes from './api/stores/stores.routes.js';
import krogerRoutes from './api/kroger/kroger.routes.js';
import streakRoutes from './api/streak/streak.routes.js';
import achievementsRoutes from './api/achievements/achievements.routes.js';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Create Express app
const app: Application = express();
const PORT = config.port;

// Middleware
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(rateLimiter);
app.use(requestLogger); // Log all incoming requests

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/meal-interactions', mealInteractionsRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/kroger', krogerRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/achievements', achievementsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error logger (before error handler)
app.use(errorLogger);

// Sentry error handler (before custom error handler)
if (config.sentry.dsn) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

startServer();

export default app;
