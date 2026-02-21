import express from 'express';
import {
  addInventoryItem,
  getHouseholdInventory,
  getExpiringSoon,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  markExpiredItems,
} from './inventory.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, addInventoryItemSchema, updateInventoryItemSchema } from '../../middleware/validators.js';

const router = express.Router();

// All inventory routes require authentication
router.use(authenticateToken);

// Add inventory item
router.post('/', validate(addInventoryItemSchema), addInventoryItem);

// Get household inventory
router.get('/household/:householdId', getHouseholdInventory);

// Get items expiring soon
router.get('/household/:householdId/expiring-soon', getExpiringSoon);

// Get inventory statistics
router.get('/household/:householdId/stats', getInventoryStats);

// Mark expired items
router.post('/household/:householdId/mark-expired', markExpiredItems);

// Update inventory item
router.patch('/:itemId', validate(updateInventoryItemSchema), updateInventoryItem);

// Delete inventory item
router.delete('/:itemId', deleteInventoryItem);

export default router;
