import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import krogerService from '../../services/kroger/krogerService.js';
import { query } from '../../config/database.js';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

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

  const product = await krogerService.getProduct(String(productId), locationId ? String(locationId) : undefined);

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
export const checkConfiguration = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    configured: krogerService.isConfigured(),
  });
});

/**
 * Initiate Kroger OAuth2 authorization code flow
 * GET /api/kroger/auth
 */
export const initiateAuth = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!krogerService.isConfigured()) {
    throw new AppError('Kroger API is not configured', 503);
  }

  const state = crypto.randomBytes(16).toString('hex');
  // Store state in session or temporary storage for CSRF protection
  // For simplicity, we embed the user ID in the state
  const statePayload = `${req.user!.id}:${state}`;

  const redirectUri = `${req.protocol}://${req.get('host')}/api/kroger/callback`;
  const authUrl = krogerService.getAuthorizationUrl(redirectUri, statePayload);

  res.json({
    success: true,
    authUrl,
  });
});

/**
 * Handle Kroger OAuth2 callback
 * GET /api/kroger/callback
 */
export const handleCallback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    throw new AppError('Authorization code is required', 400);
  }

  // Extract user ID from state
  const stateStr = state as string || '';
  const userId = stateStr.split(':')[0];

  if (!userId) {
    throw new AppError('Invalid state parameter', 400);
  }

  const redirectUri = `${req.protocol}://${req.get('host')}/api/kroger/callback`;
  const tokens = await krogerService.exchangeCodeForToken(code, redirectUri);

  // Save tokens to user record
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await query(
    `UPDATE users SET kroger_access_token = ?, kroger_refresh_token = ?, kroger_token_expires_at = ? WHERE id = ?`,
    [tokens.access_token, tokens.refresh_token, expiresAt, userId]
  );

  // Redirect back to the app
  res.redirect('/shopping-list?kroger_connected=true');
});

/**
 * Check Kroger cart connection status
 * GET /api/kroger/cart/status
 */
export const getCartStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const users = await query<RowDataPacket[]>(
    'SELECT kroger_access_token, kroger_token_expires_at, kroger_location_id FROM users WHERE id = ?',
    [userId]
  );

  const user = users[0];
  const connected = !!(user?.kroger_access_token && new Date(user.kroger_token_expires_at) > new Date());

  res.json({
    success: true,
    connected,
    locationId: user?.kroger_location_id || null,
  });
});

/**
 * Add items to Kroger cart
 * POST /api/kroger/cart/add
 */
export const addToKrogerCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required', 400);
  }

  // Get user's Kroger tokens
  const users = await query<RowDataPacket[]>(
    'SELECT kroger_access_token, kroger_refresh_token, kroger_token_expires_at, kroger_location_id FROM users WHERE id = ?',
    [userId]
  );

  const user = users[0];
  if (!user?.kroger_access_token) {
    throw new AppError('Kroger account not connected. Please connect your Kroger account first.', 401);
  }

  // Check if token needs refresh
  let accessToken = user.kroger_access_token;
  if (new Date(user.kroger_token_expires_at) <= new Date()) {
    try {
      const newTokens = await krogerService.refreshUserToken(user.kroger_refresh_token);
      accessToken = newTokens.access_token;
      const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
      await query(
        'UPDATE users SET kroger_access_token = ?, kroger_refresh_token = ?, kroger_token_expires_at = ? WHERE id = ?',
        [newTokens.access_token, newTokens.refresh_token, expiresAt, userId]
      );
    } catch {
      throw new AppError('Kroger session expired. Please reconnect your Kroger account.', 401);
    }
  }

  // Map shopping list items to Kroger products (find UPCs)
  const results: Array<{ itemName: string; status: 'added' | 'not_found' | 'error'; krogerProduct?: string }> = [];
  const cartItems: Array<{ upc: string; quantity: number }> = [];

  for (const item of items) {
    try {
      const products = await krogerService.searchProducts(item.name, user.kroger_location_id, 1);
      if (products.length > 0 && products[0].upc) {
        cartItems.push({ upc: products[0].upc, quantity: item.quantity || 1 });
        results.push({ itemName: item.name, status: 'added', krogerProduct: products[0].description });
      } else {
        results.push({ itemName: item.name, status: 'not_found' });
      }
    } catch {
      results.push({ itemName: item.name, status: 'error' });
    }
  }

  // Add found items to cart in bulk
  if (cartItems.length > 0) {
    try {
      await krogerService.addToCart(accessToken, cartItems);
    } catch (err: any) {
      throw new AppError(`Failed to add items to Kroger cart: ${err.message}`, 500);
    }
  }

  res.json({
    success: true,
    added: results.filter(r => r.status === 'added').length,
    failed: results.filter(r => r.status !== 'added').length,
    results,
  });
});
