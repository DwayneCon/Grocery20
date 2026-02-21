import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import krogerService from '../../services/kroger/krogerService.js';

/**
 * Search for products in Kroger
 */
export const searchProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { searchTerm, locationId, limit } = req.query;

  if (!searchTerm || typeof searchTerm !== 'string') {
    throw new AppError('Search term is required', 400);
  }

  if (!krogerService.isConfigured()) {
    throw new AppError('Kroger API is not configured', 503);
  }

  const products = await krogerService.searchProducts(
    searchTerm,
    locationId as string | undefined,
    limit ? parseInt(limit as string) : 10
  );

  res.json({
    success: true,
    count: products.length,
    data: products,
  });
});

/**
 * Get product details by ID
 */
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { locationId } = req.query;

  if (!krogerService.isConfigured()) {
    throw new AppError('Kroger API is not configured', 503);
  }

  const product = await krogerService.getProduct(productId, locationId as string | undefined);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: product,
  });
});

/**
 * Find Kroger stores near a location
 */
export const findStores = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zipCode, radiusMiles, limit } = req.query;

  if (!zipCode || typeof zipCode !== 'string') {
    throw new AppError('Zip code is required', 400);
  }

  if (!krogerService.isConfigured()) {
    throw new AppError('Kroger API is not configured', 503);
  }

  const stores = await krogerService.findStores(
    zipCode,
    radiusMiles ? parseInt(radiusMiles as string) : 10,
    limit ? parseInt(limit as string) : 5
  );

  res.json({
    success: true,
    count: stores.length,
    data: stores,
  });
});

/**
 * Get price for a single item
 */
export const getItemPrice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemName, locationId } = req.query;

  if (!itemName || typeof itemName !== 'string') {
    throw new AppError('Item name is required', 400);
  }

  if (!krogerService.isConfigured()) {
    throw new AppError('Kroger API is not configured', 503);
  }

  const priceData = await krogerService.getItemPrice(itemName, locationId as string | undefined);

  res.json({
    success: true,
    data: priceData,
  });
});

/**
 * Get prices for shopping list items (bulk operation)
 */
export const getBulkPrices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, locationId } = req.body;

  if (!items || !Array.isArray(items)) {
    throw new AppError('Items array is required', 400);
  }

  if (!krogerService.isConfigured()) {
    throw new AppError('Kroger API is not configured', 503);
  }

  // Validate items format
  for (const item of items) {
    if (!item.name || typeof item.quantity !== 'number') {
      throw new AppError('Each item must have a name and quantity', 400);
    }
  }

  const priceData = await krogerService.getBulkPrices(items, locationId);

  // Calculate totals
  const totalRegular = priceData.reduce((sum, item) => sum + item.totalRegular, 0);
  const totalPromo = priceData.reduce((sum, item) => {
    return sum + (item.totalPromo || item.totalRegular);
  }, 0);
  const savings = totalRegular - totalPromo;

  res.json({
    success: true,
    count: priceData.length,
    data: priceData,
    summary: {
      totalRegular: parseFloat(totalRegular.toFixed(2)),
      totalPromo: parseFloat(totalPromo.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      savingsPercent:
        totalRegular > 0 ? parseFloat(((savings / totalRegular) * 100).toFixed(1)) : 0,
    },
  });
});

/**
 * Check if Kroger API is configured
 */
export const checkConfiguration = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    configured: krogerService.isConfigured(),
  });
});
