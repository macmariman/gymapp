/**
 * Simple Application Logger
 *
 * A lightweight console-based logger for development and production.
 * Extend this with external services (Sentry, LogRocket, etc.) as needed.
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User action', { userId: '123', action: 'login' });
 * logger.error('Operation failed', { error: err.message });
 * logger.warn('Deprecated API used');
 * logger.debug('Debug info', { data });
 * ```
 */

/**
 * Format log message with context
 */
function formatLog(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] ${level}: ${message}${contextStr}`;
}

/**
 * Simple logger instance
 */
export const logger = {
  info: (context: LogContext | string, message?: string) => {
    const [ctx, msg] = typeof context === 'string' ? [undefined, context] : [context, message];
    console.log(formatLog('INFO', msg || '', ctx));
  },

  error: (context: LogContext | string, message?: string) => {
    const [ctx, msg] = typeof context === 'string' ? [undefined, context] : [context, message];
    console.error(formatLog('ERROR', msg || '', ctx));
  },

  warn: (context: LogContext | string, message?: string) => {
    const [ctx, msg] = typeof context === 'string' ? [undefined, context] : [context, message];
    console.warn(formatLog('WARN', msg || '', ctx));
  },

  debug: (context: LogContext | string, message?: string) => {
    const [ctx, msg] = typeof context === 'string' ? [undefined, context] : [context, message];
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(formatLog('DEBUG', msg || '', ctx));
    }
  }
};

/**
 * Type-safe log context
 */
export type LogContext = Record<string, unknown>;

/**
 * Helper to create user context for logs
 */
export const createUserContext = (
  userId: string,
  email?: string
): LogContext => ({
  userId,
  ...(email && { email })
});

/**
 * Helper to create request context for logs
 */
export const createRequestContext = (req: Request): LogContext => ({
  method: req.method,
  url: req.url,
  headers: Object.fromEntries(req.headers.entries())
});
