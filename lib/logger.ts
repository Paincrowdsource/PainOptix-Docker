/**
 * Universal logger that works in both server and client environments
 */

// For client-side code, use a simple console-based logger
// For server-side code, the actual winston logger will be used via webpack alias

class UniversalLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, meta?: any) {
    if (!this.isDevelopment) return;
    console.debug(`[DEBUG] ${message}`, meta || '');
  }

  info(message: string, meta?: any) {
    console.info(`[INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: any) {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, error?: any, meta?: any) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    console.error(`[ERROR] ${message}`, { error: errorData, ...meta });
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

  // Performance tracking
  metric(name: string, value: number, unit: string = 'ms', tags?: Record<string, any>) {
    if (this.isDevelopment) {
      console.debug(`[METRIC] ${name}: ${value}${unit}`, tags);
    }
  }
}

// Export universal logger instance
export const logger = new UniversalLogger();

// Export aliases for compatibility
export const winstonLogger = logger;
export class Logger extends UniversalLogger {}
export class EnhancedLogger extends UniversalLogger {}

// Export helpers
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

// Stub functions for client compatibility
export function runWithRequestContext<T>(
  context: { requestId?: string; userId?: string },
  callback: () => T
): T {
  return callback();
}

export function requestLoggingMiddleware(req: any, res: any, next: any) {
  next();
}

// Winston is not available in client
export const winston = undefined;