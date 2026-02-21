/**
 * Centralized logging utility for server-side
 *
 * Features:
 * - Structured logging with levels
 * - Request tracking
 * - Error capturing
 * - Production-ready output format
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.log(LogLevel.ERROR, message, error, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, undefined, context);
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, undefined, context);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, undefined, context);
    }
  }

  /**
   * Log HTTP requests
   */
  request(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN :
                  LogLevel.INFO;

    this.log(level, `${method} ${url} ${statusCode} ${duration}ms`, undefined, {
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  }

  /**
   * Log database queries
   */
  query(query: string, duration: number, error?: Error) {
    if (error) {
      this.error('Database query failed', error, {
        metadata: { query: this.sanitizeQuery(query), duration },
      });
    } else if (duration > 1000) {
      // Warn for slow queries (> 1 second)
      this.warn('Slow database query', {
        metadata: { query: this.sanitizeQuery(query), duration },
      });
    } else if (this.isDevelopment) {
      this.debug(`Query executed: ${duration}ms`, {
        metadata: { query: this.sanitizeQuery(query) },
      });
    }
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    context?: LogContext
  ) {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      ...(error && {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined, // Only include stack in dev
        } : error
      }),
    };

    // Console output
    const consoleMethod = level === LogLevel.ERROR ? console.error :
                         level === LogLevel.WARN ? console.warn :
                         console.log;

    if (this.isDevelopment) {
      // Pretty printing in development
      const colorCode = level === LogLevel.ERROR ? '\x1b[31m' : // Red
                       level === LogLevel.WARN ? '\x1b[33m' :  // Yellow
                       level === LogLevel.INFO ? '\x1b[36m' :  // Cyan
                       '\x1b[90m';                              // Gray
      const resetCode = '\x1b[0m';

      consoleMethod(
        `${colorCode}[${timestamp}] [${level.toUpperCase()}]${resetCode} ${message}`
      );

      if (context && Object.keys(context).length > 0) {
        console.log('  Context:', context);
      }
      if (error) {
        consoleMethod('  Error:', error);
      }
    } else {
      // Structured JSON logging in production (for log aggregation services)
      consoleMethod(JSON.stringify(logEntry));
    }

    // TODO: Send to external logging service (CloudWatch, Datadog, etc.)
    // Example: winston.log(level, message, logEntry);
  }

  /**
   * Sanitize SQL queries to remove sensitive data
   */
  private sanitizeQuery(query: string): string {
    // Remove actual values from queries to avoid logging sensitive data
    return query
      .replace(/VALUES\s*\([^)]+\)/gi, 'VALUES (...)')
      .replace(/=\s*'[^']+'/gi, "= '***'")
      .replace(/=\s*"[^"]+"/gi, '= "***"')
      .substring(0, 200); // Limit length
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.error(message, error, context);

export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);

export default logger;
