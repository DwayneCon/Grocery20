import express from 'express';
import { scanReceiptImage, scanFridgeImage } from './vision.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// All vision routes require authentication
router.use(authenticateToken);

// Scan a grocery receipt image
router.post('/receipt', scanReceiptImage);

// Scan a fridge image to identify ingredients (placeholder for Task 17)
router.post('/fridge', scanFridgeImage);

export default router;
