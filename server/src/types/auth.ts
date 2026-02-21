import { Request } from 'express';

/**
 * Extended Express Request interface with authenticated user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    householdId?: string;
  };
}

/**
 * JWT Payload interface for access tokens
 */
export interface JWTPayload {
  id: string;
  email: string;
  householdId?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Refresh Payload interface for refresh tokens
 */
export interface RefreshTokenPayload {
  id: string;
  iat?: number;
  exp?: number;
}
