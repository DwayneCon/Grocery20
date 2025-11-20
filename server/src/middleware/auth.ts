import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

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
    console.log('[Auth] Request URL:', req.method, req.originalUrl);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('[Auth] Token present:', !!token);

    if (!token) {
      console.log('[Auth] No token provided');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        console.log('[Auth] Token verification failed:', err.message);
        res.status(403).json({ error: 'Invalid or expired token', details: err.message });
        return;
      }

      console.log('[Auth] Token verified successfully for user:', (decoded as any)?.email);
      req.user = decoded as AuthRequest['user'];
      next();
    });
  } catch (error) {
    console.log('[Auth] Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
