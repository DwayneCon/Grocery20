/**
 * Request/Response logging middleware
 * Logs all HTTP requests with timing, status codes, and user context
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Middleware to log all incoming HTTP requests and outgoing responses
 */
export const requestLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Log incoming request
  logger.debug(`Incoming ${method} ${originalUrl}`, {
    metadata: {
      ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
    },
  });

  // Capture the original res.end function
  const originalEnd = res.end;

  // Override res.end to log when response is sent
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    // Restore original end function
    res.end = originalEnd;

    // Calculate request duration
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Log the request with appropriate level based on status code
    logger.request(
      method,
      originalUrl,
      statusCode,
      duration,
      req.user?.id
    );

    // Call the original end function
    return originalEnd.call(res, chunk, encoding, callback);
  };

  next();
};

/**
 * Middleware to log errors in requests
 */
export const errorLogger = (err: Error, req: AuthRequest, res: Response, next: NextFunction) => {
  const { method, originalUrl } = req;

  logger.error(
    `Error in ${method} ${originalUrl}`,
    err,
    {
      method,
      url: originalUrl,
      userId: req.user?.id,
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    }
  );

  // Pass error to next error handler
  next(err);
};

export default requestLogger;
