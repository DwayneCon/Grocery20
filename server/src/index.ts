import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Import routes
import authRoutes from './api/auth/auth.routes.js';
import aiRoutes from './api/ai/ai.routes.js';
import householdRoutes from './api/households/households.routes.js';
import recipeRoutes from './api/meals/recipes.routes.js';
import mealPlanRoutes from './api/meals/mealPlans.routes.js';
import shoppingRoutes from './api/shopping/shopping.routes.js';
import budgetRoutes from './api/budget/budget.routes.js';
import nutritionRoutes from './api/nutrition/nutrition.routes.js';
import inventoryRoutes from './api/inventory/inventory.routes.js';
import storesRoutes from './api/stores/stores.routes.js';

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

// Health check endpoint
app.get('/health', (req, res) => {
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
app.use('/api/shopping', shoppingRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stores', storesRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
