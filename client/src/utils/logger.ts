/**
 * Centralized logging utility for client-side error tracking
 *
 * Features:
 * - Structured logging with levels (error, warn, info, debug)
 * - Environment-aware (production vs development)
 * - Integration-ready for services like Sentry, LogRocket, etc.
 * - User context tracking
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  userId?: string;
  userEmail?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment: boolean;
  private context: LogContext = {};

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
  }

  /**
   * Set user context for all subsequent logs
   */
  setUserContext(userId: string, userEmail?: string) {
    this.context.userId = userId;
    this.context.userEmail = userEmail;
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUserContext() {
    this.context.userId = undefined;
    this.context.userEmail = undefined;
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.log(LogLevel.ERROR, message, error, context);

    // TODO: Send to error tracking service (Sentry, etc.)
    // Example: Sentry.captureException(error);
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
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    context?: LogContext
  ) {
    const timestamp = new Date().toISOString();
    const fullContext = { ...this.context, ...context };

    const logEntry = {
      timestamp,
      level,
      message,
      ...fullContext,
      ...(error ? {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error
      } : {}),
    };

    // Console output with styling
    const consoleMethod = level === LogLevel.ERROR ? console.error :
                         level === LogLevel.WARN ? console.warn :
                         console.log;

    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (this.isDevelopment) {
      // Pretty printing in development
      consoleMethod(prefix, message);
      if (Object.keys(fullContext).length > 0) {
        console.log('Context:', fullContext);
      }
      if (error) {
        consoleMethod('Error:', error);
      }
    } else {
      // Structured JSON logging in production
      consoleMethod(JSON.stringify(logEntry));
    }

    // TODO: Send to backend logging endpoint for persistence
    // Example: fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) });
  }

  /**
   * Track user actions/events
   */
  trackEvent(event: string, properties?: Record<string, any>) {
    this.info(`Event: ${event}`, { action: event, metadata: properties });

    // TODO: Send to analytics service
    // Example: analytics.track(event, properties);
  }

  /**
   * Track page views
   */
  trackPageView(page: string, properties?: Record<string, any>) {
    this.info(`Page View: ${page}`, { component: page, metadata: properties });

    // TODO: Send to analytics service
    // Example: analytics.page(page, properties);
  }

  /**
   * Track API calls
   */
  trackAPICall(method: string, url: string, status: number, duration: number) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(
      level,
      `API ${method} ${url} - ${status} (${duration}ms)`,
      undefined,
      {
        action: 'api_call',
        metadata: { method, url, status, duration },
      }
    );
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
