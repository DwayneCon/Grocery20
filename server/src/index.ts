import { createServer } from 'http';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import pool, { testConnection } from './config/database.js';
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
import { startScheduler } from './services/cron/scheduler.js';
import { createSocketServer } from './socket/socketServer.js';

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
import suggestionsRoutes from './api/suggestions/suggestions.routes.js';
import ttsRoutes from './api/ai/tts.routes.js';
import visionRoutes from './api/vision/vision.routes.js';
import gamificationRoutes from './api/gamification/gamification.routes.js';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Create Express app and HTTP server (required for Socket.IO)
const app: Application = express();
const httpServer = createServer(app);
const PORT = config.port;

// Attach Socket.IO to the HTTP server
// Exported so other modules can emit events if needed
export const io = createSocketServer(httpServer);

// Middleware
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(rateLimiter);
app.use(requestLogger); // Log all incoming requests

// Enhanced health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, any> = {};
  let overallHealthy = true;

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    const dbLatency = Date.now() - dbStart;
    checks.database = { status: 'healthy', latency: `${dbLatency}ms` };
  } catch {
    checks.database = { status: 'unhealthy', latency: null };
    overallHealthy = false;
  }

  // Check OpenAI API key configuration
  checks.openai = { configured: Boolean(config.openai.apiKey) };

  // Memory usage
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

  const status = overallHealthy ? 'healthy' : 'unhealthy';

  res.status(overallHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
    memory: {
      heapUsed: `${toMB(mem.heapUsed)} MB`,
      heapTotal: `${toMB(mem.heapTotal)} MB`,
      rss: `${toMB(mem.rss)} MB`,
    },
    checks,
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
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/ai/tts', ttsRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/gamification', gamificationRoutes);

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

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info(`Health: http://localhost:${PORT}/health`);
      logger.info(`Socket.IO: enabled`);

      // Start cron-based background scheduler
      startScheduler();
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

if (config.nodeEnv !== 'test') {
  startServer();
}

export default app;
