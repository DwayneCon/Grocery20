import { Response } from 'express';
import { AuthRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { krogerService } from '../../services/kroger/krogerService.js';
import { RowDataPacket } from 'mysql2';
import { logger } from '../../utils/logger.js';

/**
 * Get all available stores
 * GET /api/stores
 */
export const getStores = asyncHandler(async (_req: AuthRequest, res: Response) => {
  try {
    // For MVP, return a static list of supported stores
    // In production, this would come from a database or configuration
    const stores = [
      {
        id: 'kroger',
        name: 'Kroger',
        logo: '/assets/stores/kroger.png',
        hasAPI: true,
        hasScraping: false,
        features: ['price_tracking', 'deals', 'online_ordering'],
      },
      {
        id: 'walmart',
        name: 'Walmart',
        logo: '/assets/stores/walmart.png',
        hasAPI: true,
        hasScraping: false,
        features: ['price_tracking', 'deals', 'pickup'],
      },
      {
        id: 'target',
        name: 'Target',
        logo: '/assets/stores/target.png',
        hasAPI: false,
        hasScraping: true,
        features: ['deals', 'weekly_ads'],
      },
      {
        id: 'aldi',
        name: 'Aldi',
        logo: '/assets/stores/aldi.png',
        hasAPI: false,
        hasScraping: true,
        features: ['weekly_ads'],
      },
    ];

    return res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    logger.error('Error getting stores:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get stores',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Search products at stores
 * GET /api/stores/search
 */
export const searchProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { query: searchQuery, storeId } = req.query;

  if (!searchQuery) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  try {
    // Get products from database (previously scraped/synced data)
    let sql = `
      SELECT
        id,
        ingredient_id as ingredientId,
        store_name as storeName,
        product_name as productName,
        brand,
        price,
        unit,
        quantity,
        on_sale as onSale,
        sale_price as salePrice,
        last_scraped as lastScraped,
        url
      FROM store_products
      WHERE product_name LIKE ?
    `;
    const params: any[] = [`%${searchQuery}%`];

    if (storeId) {
      sql += ' AND store_name = ?';
      params.push(storeId);
    }

    sql += ' ORDER BY price ASC LIMIT 50';

    const products = await query(sql, params);

    return res.json({
      success: true,
      data: products,
      count: products.length,
      message: products.length === 0 ? 'No products found. Price data will be available after scraping is implemented.' : undefined,
    });
  } catch (error) {
    logger.error('Error searching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get product prices for an ingredient
 * GET /api/stores/prices/:ingredientId
 */
export const getIngredientPrices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ingredientId } = req.params;

  try {
    // Get prices from different stores
    const prices: any[] = await query(
      `SELECT
        id,
        store_name as storeName,
        product_name as productName,
        brand,
        price,
        unit,
        quantity,
        on_sale as onSale,
        sale_price as salePrice,
        last_scraped as lastScraped,
        url
      FROM store_products
      WHERE ingredient_id = ?
      ORDER BY
        CASE WHEN on_sale = TRUE THEN sale_price ELSE price END ASC,
        last_scraped DESC`,
      [ingredientId]
    );

    // Group by store for comparison
    const byStore: {[storeName: string]: any[]} = {};
    for (const product of prices) {
      if (!byStore[product.storeName]) {
        byStore[product.storeName] = [];
      }
      byStore[product.storeName].push(product);
    }

    // Find best price
    const bestPrice = prices.length > 0 ? prices[0] : null;

    return res.json({
      success: true,
      data: {
        allPrices: prices,
        byStore,
        bestPrice,
      },
    });
  } catch (error) {
    logger.error('Error getting ingredient prices:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get ingredient prices',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get weekly deals/specials
 * GET /api/stores/:storeId/deals
 */
export const getStoreDeals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { storeId } = req.params;

  try {
    // Get current deals for the store
    const deals: any[] = await query(
      `SELECT
        id,
        ingredient_id as ingredientId,
        store_name as storeName,
        product_name as productName,
        brand,
        price,
        sale_price as salePrice,
        unit,
        quantity,
        last_scraped as lastScraped,
        url
      FROM store_products
      WHERE store_name = ? AND on_sale = TRUE
      ORDER BY (price - sale_price) DESC, last_scraped DESC
      LIMIT 100`,
      [storeId]
    );

    return res.json({
      success: true,
      data: deals,
      count: deals.length,
      message: deals.length === 0 ? 'No deals found. Scraping functionality coming soon!' : undefined,
    });
  } catch (error) {
    logger.error('Error getting store deals:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get store deals',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Add/update store product (for manual entry or scraping results)
 * POST /api/stores/products
 */
export const addStoreProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ingredientId, storeName, productName, brand, price, unit, quantity, onSale, salePrice, url } = req.body;
  try {
    // Check if product already exists
    const existing: any[] = await query(
      'SELECT id FROM store_products WHERE store_name = ? AND product_name = ? AND brand = ?',
      [storeName, productName, brand || null]
    );

    let productId: string;

    if (existing.length > 0) {
      // Update existing product
      productId = existing[0].id;
      await query(
        `UPDATE store_products
         SET price = ?, unit = ?, quantity = ?, on_sale = ?, sale_price = ?, url = ?, last_scraped = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [price, unit, quantity, onSale || false, salePrice || null, url || null, productId]
      );
    } else {
      // Create new product
      productId = uuidv4();
      await query(
        `INSERT INTO store_products
         (id, ingredient_id, store_name, product_name, brand, price, unit, quantity, on_sale, sale_price, url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, ingredientId || null, storeName, productName, brand || null, price, unit, quantity, onSale || false, salePrice || null, url || null]
      );
    }

    return res.json({
      success: true,
      message: existing.length > 0 ? 'Product updated successfully' : 'Product added successfully',
      productId,
    });
  } catch (error) {
    logger.error('Error adding/updating store product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add/update product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get price comparison for shopping list
 * POST /api/stores/compare-prices
 */
export const comparePrices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Items array is required',
    });
  }

  try {
    // For each item in the list, find the best prices
    const comparison: any[] = [];

    for (const item of items) {
      const { ingredientId, name, quantity, unit } = item;

      // Get prices for this ingredient
      const prices: any[] = await query(
        `SELECT
          store_name as storeName,
          product_name as productName,
          brand,
          price,
          sale_price as salePrice,
          on_sale as onSale,
          unit,
          quantity as packageQuantity
        FROM store_products
        WHERE ingredient_id = ? OR product_name LIKE ?
        ORDER BY
          CASE WHEN on_sale = TRUE THEN sale_price ELSE price END ASC
        LIMIT 5`,
        [ingredientId || null, `%${name}%`]
      );

      comparison.push({
        item: name,
        requestedQuantity: quantity,
        requestedUnit: unit,
        prices,
        bestPrice: prices[0] || null,
        savings: prices.length > 1 && prices[0] ?
          (prices[prices.length - 1].price - prices[0].price) * quantity : 0,
      });
    }

    // Calculate total cost at each store
    const storeNames = [...new Set(comparison.flatMap(c => c.prices.map((p: any) => p.storeName)))];
    const storeTotals = storeNames.map(storeName => {
      const total = comparison.reduce((sum, item) => {
        const storePrice = item.prices.find((p: any) => p.storeName === storeName);
        if (storePrice) {
          const price = storePrice.onSale ? storePrice.salePrice : storePrice.price;
          return sum + (price * item.requestedQuantity);
        }
        return sum;
      }, 0);

      return {
        storeName,
        total: Math.round(total * 100) / 100,
        itemsAvailable: comparison.filter(item =>
          item.prices.some((p: any) => p.storeName === storeName)
        ).length,
      };
    });

    storeTotals.sort((a, b) => a.total - b.total);

    return res.json({
      success: true,
      data: {
        itemComparison: comparison,
        storeTotals,
        bestStore: storeTotals[0] || null,
        potentialSavings: storeTotals.length > 1 ? storeTotals[storeTotals.length - 1].total - storeTotals[0].total : 0,
      },
    });
  } catch (error) {
    logger.error('Error comparing prices:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compare prices',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Compare prices using live Kroger API + scraped store data
 * POST /api/stores/compare-live
 */
export const compareLivePrices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, locationId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Items array is required',
    });
  }

  // 1. Get live Kroger prices
  let krogerPrices: any[] = [];
  let krogerSummary = { totalRegular: 0, totalPromo: 0, savings: 0, savingsPercent: 0 };

  if (krogerService.isConfigured()) {
    try {
      const krogerItems = items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity || 1,
      }));
      const krogerResults = await krogerService.getBulkPrices(krogerItems, locationId);
      krogerPrices = krogerResults;

      let totalRegular = 0;
      let totalPromo = 0;
      krogerResults.forEach((r: any) => {
        totalRegular += r.totalRegular || 0;
        totalPromo += r.totalPromo || r.totalRegular || 0;
      });
      krogerSummary = {
        totalRegular,
        totalPromo,
        savings: totalRegular - totalPromo,
        savingsPercent: totalRegular > 0 ? ((totalRegular - totalPromo) / totalRegular) * 100 : 0,
      };
    } catch (err) {
      logger.error('Kroger live pricing failed:', err);
    }
  }

  // 2. Get scraped store prices from store_products table
  const scrapedStores: { [storeName: string]: { total: number; itemsFound: number; items: any[] } } = {};

  for (const item of items) {
    const rows = await query<RowDataPacket[]>(
      `SELECT * FROM store_products
       WHERE product_name LIKE ? AND store_name != 'Kroger'
       ORDER BY COALESCE(sale_price, price) ASC`,
      [`%${item.name}%`]
    );

    rows.forEach((row: any) => {
      if (!scrapedStores[row.store_name]) {
        scrapedStores[row.store_name] = { total: 0, itemsFound: 0, items: [] };
      }
      const effectivePrice = row.on_sale && row.sale_price ? row.sale_price : row.price;
      const qty = item.quantity || 1;
      scrapedStores[row.store_name].total += effectivePrice * qty;
      scrapedStores[row.store_name].itemsFound++;
      scrapedStores[row.store_name].items.push({
        itemName: item.name,
        productName: row.product_name,
        brand: row.brand,
        price: row.price,
        salePrice: row.sale_price,
        onSale: row.on_sale,
        quantity: qty,
        totalPrice: effectivePrice * qty,
      });
    });
  }

  // 3. Build unified response
  const stores = [];

  // Add Kroger
  if (krogerPrices.length > 0) {
    stores.push({
      storeName: 'Kroger',
      source: 'live_api',
      totalRegular: krogerSummary.totalRegular,
      totalWithDeals: krogerSummary.totalPromo,
      savings: krogerSummary.savings,
      savingsPercent: krogerSummary.savingsPercent,
      itemsFound: krogerPrices.filter((p: any) => p.krogerData !== null).length,
      itemsTotal: items.length,
      items: krogerPrices.map((p: any) => ({
        itemName: p.itemName,
        productName: p.krogerData?.name || null,
        brand: p.krogerData?.brand || null,
        regularPrice: p.krogerData?.regularPrice || null,
        promoPrice: p.krogerData?.promoPrice || null,
        imageUrl: p.krogerData?.imageUrl || null,
        quantity: p.quantity,
        totalPrice: p.totalPromo || p.totalRegular,
        found: p.krogerData !== null,
      })),
      lastUpdated: new Date().toISOString(),
    });
  }

  // Add scraped stores
  Object.entries(scrapedStores).forEach(([storeName, data]) => {
    stores.push({
      storeName,
      source: 'scraped',
      totalRegular: data.total,
      totalWithDeals: data.total,
      savings: 0,
      savingsPercent: 0,
      itemsFound: data.itemsFound,
      itemsTotal: items.length,
      items: data.items,
      lastUpdated: null,
    });
  });

  // Sort stores by totalWithDeals (cheapest first)
  stores.sort((a, b) => a.totalWithDeals - b.totalWithDeals);

  const bestStore = stores.length > 0 ? stores[0].storeName : null;
  const potentialSavings = stores.length > 1
    ? stores[stores.length - 1].totalWithDeals - stores[0].totalWithDeals
    : 0;

  return res.json({
    success: true,
    stores,
    bestStore,
    potentialSavings,
    krogerConfigured: krogerService.isConfigured(),
    itemsRequested: items.length,
  });
});

/**
 * Trigger a store scrape (admin endpoint)
 * POST /api/stores/scrape/:storeName
 */
export const triggerScrape = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { storeName } = req.params;

  let scraper: any;
  switch (String(storeName).toLowerCase()) {
    case 'walmart': {
      const { WalmartScraper } = await import('../../services/scraper/walmartScraper.js');
      scraper = new WalmartScraper();
      break;
    }
    case 'aldi': {
      const { AldiScraper } = await import('../../services/scraper/aldiScraper.js');
      scraper = new AldiScraper();
      break;
    }
    default:
      return res.status(400).json({ success: false, message: `Unknown store: ${storeName}` });
  }

  const products = await scraper.scrape();
  const saved = await scraper.saveProducts(products);

  return res.json({
    success: true,
    store: storeName,
    productsScraped: products.length,
    productsSaved: saved,
    timestamp: new Date().toISOString(),
  });
});
