import express from 'express';
import { register, login, refreshToken, logout, getCurrentUser } from './auth.controller.js';
import { validate, registerSchema, loginSchema } from '../../middleware/validators.js';
import { authenticateToken } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/security.js';

const router = express.Router();

// Public routes
router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

export default router;
