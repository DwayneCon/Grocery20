import express from 'express';
import { getSuggestions } from './suggestions.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// All suggestions routes require authentication
router.use(authenticateToken);

// Get proactive suggestions for a household
router.get('/:householdId', getSuggestions);

export default router;
