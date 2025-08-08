/**
 * Client-safe logger for browser environments
 * Provides same interface as winston logger but uses console methods
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, meta?: any) {
    if (!this.isDevelopment && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...meta
    };

    switch (level) {
      case 'debug':
        console.debug(`[${timestamp}] [DEBUG]`, message, meta || '');
        break;
      case 'info':
        console.info(`[${timestamp}] [INFO]`, message, meta || '');
        break;
      case 'warn':
        console.warn(`[${timestamp}] [WARN]`, message, meta || '');
        break;
      case 'error':
        console.error(`[${timestamp}] [ERROR]`, message, meta || '');
        break;
    }

    // In production, we could send logs to a monitoring service
    if (!this.isDevelopment && level === 'error') {
      // TODO: Send to monitoring service
    }
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, error?: any, meta?: any) {
    const errorMeta = {
      ...meta,
      ...(error instanceof Error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      } : { error })
    };
    
    this.log('error', message, errorMeta);
  }

  // Service helpers
  service(name: string, status: 'initialized' | 'failed', details?: string) {
    if (status === 'initialized') {
      this.info(`Service initialized: ${name}`, { service: name, details });
    } else {
      this.error(`Service failed: ${name}`, undefined, { service: name, details });
    }
  }

  // API error helper
  apiError(endpoint: string, error: unknown, context?: Record<string, any>) {
    this.error(`API Error: ${endpoint}`, error as Error, { endpoint, context });
  }

  // Performance tracking (client-side)
  metric(name: string, value: number, unit: string = 'ms', tags?: Record<string, any>) {
    if (this.isDevelopment) {
      console.debug(`[METRIC] ${name}: ${value}${unit}`, tags);
    }
    // In production, send to analytics
  }
}

// Export singleton instance
export const logger = new ClientLogger();

// Export for compatibility
export const winstonLogger = logger;
export const logHelpers = {
  assessment: (action: string, assessmentId: string, details?: any) => {
    logger.info(`Assessment: ${action}`, {
      category: 'assessment',
      action,
      assessmentId,
      ...details
    });
  },
  
  payment: (action: string, sessionId: string, details?: any) => {
    logger.info(`Payment: ${action}`, {
      category: 'payment',
      action,
      sessionId,
      ...details
    });
  },
  
  pdf: (action: string, details?: any) => {
    logger.info(`PDF: ${action}`, {
      category: 'pdf',
      action,
      ...details
    });
  },
  
  email: (action: string, recipient: string, details?: any) => {
    logger.info(`Email: ${action}`, {
      category: 'email',
      action,
      recipient,
      ...details
    });
  },
  
  admin: (action: string, adminId: string, resourceType: string, resourceId?: string, metadata?: any) => {
    logger.info(`Admin: ${action}`, {
      audit: true,
      action,
      resourceType,
      resourceId,
      adminId,
      ...metadata
    });
  }
};

// Stub functions that don't apply to client
export function runWithRequestContext<T>(
  context: { requestId?: string; userId?: string },
  callback: () => T
): T {
  return callback();
}

export function requestLoggingMiddleware(req: any, res: any, next: any) {
  next();
}

export class EnhancedLogger extends ClientLogger {}
export { ClientLogger as Logger };