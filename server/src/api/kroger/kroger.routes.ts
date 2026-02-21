import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import {
  searchProducts,
  getProduct,
  findStores,
  getItemPrice,
  getBulkPrices,
  checkConfiguration,
} from './kroger.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Check if Kroger API is configured
router.get('/config', checkConfiguration);

// Product search
router.get('/products/search', searchProducts);

// Get product by ID
router.get('/products/:productId', getProduct);

// Find stores
router.get('/stores', findStores);

// Get price for single item
router.get('/price', getItemPrice);

// Get bulk prices for shopping list
router.post('/prices/bulk', getBulkPrices);

export default router;
