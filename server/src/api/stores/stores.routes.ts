import express from 'express';
import {
  getStores,
  searchProducts,
  getIngredientPrices,
  getStoreDeals,
  addStoreProduct,
  comparePrices,
} from './stores.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, addStoreProductSchema, comparePricesSchema } from '../../middleware/validators.js';

const router = express.Router();

// All store routes require authentication
router.use(authenticateToken);

// Get available stores
router.get('/', getStores);

// Search products across stores
router.get('/search', searchProducts);

// Compare prices for shopping list
router.post('/compare-prices', validate(comparePricesSchema), comparePrices);

// Add/update store product
router.post('/products', validate(addStoreProductSchema), addStoreProduct);

// Get prices for a specific ingredient
router.get('/prices/:ingredientId', getIngredientPrices);

// Get store deals
router.get('/:storeId/deals', getStoreDeals);

export default router;
