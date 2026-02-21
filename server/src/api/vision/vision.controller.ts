import { Response } from 'express';
import { AuthRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { scanReceipt } from '../../services/vision/receiptScanner.js';
import { logger } from '../../utils/logger.js';

/**
 * Scan a grocery receipt image and extract structured item/price data.
 * POST /api/vision/receipt
 *
 * Body: { image: string } - base64-encoded image (data URL or raw base64)
 */
export const scanReceiptImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { image } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Image is required. Provide a base64-encoded image in the "image" field.',
    });
  }

  // Basic validation: check that the string looks like base64 image data
  if (!image.startsWith('data:image/') && image.length < 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid image data. Provide a valid base64-encoded image.',
    });
  }

  try {
    logger.info('Receipt scan requested', {
      userId: req.user?.id,
      metadata: { imageSize: image.length },
    });

    const receiptData = await scanReceipt(image);

    return res.json({
      success: true,
      data: receiptData,
    });
  } catch (error) {
    logger.error('Receipt scan failed', error as Error, {
      userId: req.user?.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to scan receipt',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Scan a fridge image and identify ingredients, then suggest meals.
 * POST /api/vision/fridge
 *
 * Body: { image: string } - base64-encoded image
 *
 * NOTE: Placeholder for Task 17 - Fridge scanning feature.
 */
export const scanFridgeImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { image } = req.body;

  if (!image || typeof image !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Image is required. Provide a base64-encoded image in the "image" field.',
    });
  }

  try {
    logger.info('Fridge scan requested', {
      userId: req.user?.id,
    });

    // Placeholder response - full implementation in Task 17
    return res.json({
      success: true,
      message: 'Fridge scanning feature coming soon!',
      data: {
        ingredients: [],
        suggestedMeals: [],
      },
    });
  } catch (error) {
    logger.error('Fridge scan failed', error as Error, {
      userId: req.user?.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to scan fridge',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
