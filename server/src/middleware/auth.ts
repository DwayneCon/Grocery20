import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    householdId?: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    logger.debug('Auth request', { method: req.method, url: req.originalUrl });
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.debug('No token provided');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn('Token verification failed', { metadata: { reason: err.message } });
        res.status(403).json({ error: 'Invalid or expired token', details: err.message });
        return;
      }

      req.user = decoded as AuthRequest['user'];
      next();
    });
  } catch (error) {
    logger.error('Authentication error', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const generateAccessToken = (payload: string | object | Buffer): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: string | object | Buffer): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
