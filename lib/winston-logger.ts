/**
 * Winston-based production logger with structured logging
 * Implements request tracking, error serialization, and multi-transport support
 */

import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';
import { SupabaseTransport, metricsBatcher } from './winston-supabase-transport';

// Create async local storage for request context
const asyncLocalStorage = new AsyncLocalStorage<{ requestId?: string; userId?: string }>();

// Custom format for console output in development
const devFormat = winston.format.printf(({ timestamp, level, message, requestId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  if (requestId) msg += ` [${requestId}]`;
  msg += `: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create the logger instance
const winstonLoggerInstance = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'painoptix',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: []
});

// Configure transports based on environment
if (process.env.NODE_ENV === 'production') {
  // Production transports
  
  // Add Supabase transport for centralized logging
  winstonLoggerInstance.add(new SupabaseTransport({
    level: 'info', // Only log info and above to database
    handleExceptions: true,
    handleRejections: true
  }));
  
  // Keep file transports as backup
  winstonLoggerInstance.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }));
  
  winstonLoggerInstance.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    tailable: true
  }));
  
  // Console output for production (structured JSON)
  winstonLoggerInstance.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
} else {
  // Development transport with colored output
  winstonLoggerInstance.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      devFormat
    )
  }));
  
  // Also add Supabase transport in development for testing
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    winstonLoggerInstance.add(new SupabaseTransport({
      level: 'debug', // Log everything in development
      handleExceptions: true,
      handleRejections: true
    }));
  }
}

// Enhanced logger wrapper with request context
export class EnhancedLogger {
  private addContext(info: any) {
    const store = asyncLocalStorage.getStore();
    if (store?.requestId) {
      info.requestId = store.requestId;
    }
    if (store?.userId) {
      info.userId = store.userId;
    }
    return info;
  }

  debug(message: string, meta?: any) {
    winstonLoggerInstance.debug(message, this.addContext(meta || {}));
  }

  info(message: string, meta?: any) {
    winstonLoggerInstance.info(message, this.addContext(meta || {}));
  }

  warn(message: string, meta?: any) {
    winstonLoggerInstance.warn(message, this.addContext(meta || {}));
  }

  error(message: string, error?: Error | any, meta?: any) {
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
    
    winstonLoggerInstance.error(message, this.addContext(errorMeta));
  }

  // Specialized logging methods
  http(req: any, res: any, responseTime: number) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
    });
  }

  database(operation: string, query: string, duration: number, error?: Error) {
    const level = error ? 'error' : 'debug';
    const message = `Database ${operation}`;
    const meta = {
      operation,
      query,
      duration,
      ...(error && { error: error.message })
    };
    
    if (error) {
      this.error(message, error, meta);
    } else {
      this.debug(message, meta);
    }
  }

  security(event: string, details: any) {
    this.warn(`Security Event: ${event}`, {
      securityEvent: event,
      ...details
    });
  }

  performance(metric: string, value: number, unit: string = 'ms') {
    this.info(`Performance Metric: ${metric}`, {
      metric,
      value,
      unit
    });
  }

  audit(action: string, resourceType: string, resourceId?: string, metadata?: any) {
    this.info(`Audit: ${action}`, {
      audit: true,
      action,
      resourceType,
      resourceId,
      ...metadata
    });
  }
}

// Create singleton instance
export const winstonLogger = new EnhancedLogger();

// Export context management functions
export function runWithRequestContext<T>(
  context: { requestId?: string; userId?: string },
  callback: () => T
): T {
  return asyncLocalStorage.run(context, callback);
}

// Middleware for Express/Next.js
export function requestLoggingMiddleware(req: any, res: any, next: any) {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const startTime = Date.now();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Log request start
  winstonLogger.debug('Request started', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });
  
  // Intercept response end
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const responseTime = Date.now() - startTime;
    
    runWithRequestContext({ requestId }, () => {
      winstonLogger.http(req, res, responseTime);
    });
    
    originalEnd.apply(res, args);
  };
  
  // Continue with request context
  runWithRequestContext({ requestId }, () => {
    next();
  });
}

// Helper function to generate request ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}


// Export typed logger methods for backwards compatibility
export const logger = {
  debug: (message: string, ...args: any[]) => winstonLogger.debug(message, args[0]),
  info: (message: string, ...args: any[]) => winstonLogger.info(message, args[0]),
  warn: (message: string, ...args: any[]) => winstonLogger.warn(message, args[0]),
  error: (message: string, error?: any, ...args: any[]) => winstonLogger.error(message, error, args[0]),
  
  // Service helpers
  service: (name: string, status: 'initialized' | 'failed', details?: string) => {
    if (status === 'initialized') {
      winstonLogger.info(`Service initialized: ${name}`, { service: name, details });
    } else {
      winstonLogger.error(`Service failed: ${name}`, undefined, { service: name, details });
    }
  },
  
  // API error helper
  apiError: (endpoint: string, error: unknown, context?: Record<string, any>) => {
    winstonLogger.error(`API Error: ${endpoint}`, error as Error, { endpoint, context });
  },
  
  // Performance tracking
  metric: (name: string, value: number, unit: string = 'ms', tags?: Record<string, any>) => {
    metricsBatcher.add(name, value, unit, tags);
  }
};

// Specialized log helpers
export const logHelpers = {
  assessment: (action: string, assessmentId: string, details?: any) => {
    winstonLogger.info(`Assessment: ${action}`, {
      category: 'assessment',
      action,
      assessmentId,
      ...details
    });
  },
  
  payment: (action: string, sessionId: string, details?: any) => {
    winstonLogger.info(`Payment: ${action}`, {
      category: 'payment',
      action,
      sessionId,
      ...details
    });
  },
  
  pdf: (action: string, details?: any) => {
    winstonLogger.info(`PDF: ${action}`, {
      category: 'pdf',
      action,
      ...details
    });
  },
  
  email: (action: string, recipient: string, details?: any) => {
    winstonLogger.info(`Email: ${action}`, {
      category: 'email',
      action,
      recipient,
      ...details
    });
  },
  
  admin: (action: string, adminId: string, resourceType: string, resourceId?: string, metadata?: any) => {
    winstonLogger.audit(action, resourceType, resourceId, {
      adminId,
      ...metadata
    });
  }
};

// Export Winston instance for advanced usage
export { winston };