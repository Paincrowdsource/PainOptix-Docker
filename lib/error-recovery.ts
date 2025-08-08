import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

export interface RecoverableError extends Error {
  isRecoverable: boolean;
  retryAfter?: number;
  errorCode?: string;
  context?: any;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
      return true;
    }
    
    // Retry on specific HTTP status codes
    if (error.status === 429 || // Rate limited
        error.status === 502 || // Bad gateway
        error.status === 503 || // Service unavailable
        error.status === 504) { // Gateway timeout
      return true;
    }
    
    // Don't retry on client errors (4xx except 429)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    
    return true;
  }
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      logger.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries}`, {
        error: error instanceof Error ? error.message : error,
        delay,
        function: fn.name
      });
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Create a recoverable error with context
 */
export function createRecoverableError(
  message: string,
  originalError?: any,
  context?: any
): RecoverableError {
  const error = new Error(message) as RecoverableError;
  error.isRecoverable = true;
  error.errorCode = generateErrorCode();
  error.context = context;
  
  if (originalError) {
    error.stack = originalError.stack;
    error.cause = originalError;
  }
  
  return error;
}

/**
 * Generate a unique error code for tracking
 */
export function generateErrorCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Check if an error is retriable
 */
export function isRetriableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET') {
    return true;
  }
  
  // HTTP errors
  if (error.status === 429 || // Rate limited
      error.status === 502 || // Bad gateway
      error.status === 503 || // Service unavailable
      error.status === 504) { // Gateway timeout
    return true;
  }
  
  // Database errors
  if (error.code === 'PGRST301' || // Database timeout
      error.code === '57P03' || // Database shutdown
      error.code === '08006' || // Connection failure
      error.code === '08001') { // Unable to connect
    return true;
  }
  
  // Stripe errors
  if (error.type === 'StripeConnectionError' ||
      error.type === 'StripeAPIError') {
    return true;
  }
  
  return false;
}

/**
 * Store failed data locally for later retry
 */
export async function storeFailedOperation(
  operation: string,
  data: any,
  error: any
): Promise<string> {
  const failureId = generateErrorCode();
  const failureData = {
    id: failureId,
    operation,
    data,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    } : error,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  
  try {
    // Store in localStorage for web
    if (typeof window !== 'undefined') {
      const failures = getStoredFailures();
      failures.push(failureData);
      
      // Keep only last 50 failures
      if (failures.length > 50) {
        failures.shift();
      }
      
      localStorage.setItem('painoptix_failed_operations', JSON.stringify(failures));
    }
    
    logger.info('Stored failed operation for retry', {
      failureId,
      operation
    });
    
    return failureId;
  } catch (storeError) {
    logger.error('Failed to store operation for retry', {
      error: storeError,
      originalError: error
    });
    throw error;
  }
}

/**
 * Get stored failures from localStorage
 */
export function getStoredFailures(): any[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('painoptix_failed_operations');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Retry a specific failed operation
 */
export async function retryFailedOperation(
  failureId: string,
  retryFn: (data: any) => Promise<any>
): Promise<boolean> {
  const failures = getStoredFailures();
  const failureIndex = failures.findIndex(f => f.id === failureId);
  
  if (failureIndex === -1) {
    logger.warn('Failed operation not found', { failureId });
    return false;
  }
  
  const failure = failures[failureIndex];
  
  try {
    await retryFn(failure.data);
    
    // Remove from failures on success
    failures.splice(failureIndex, 1);
    localStorage.setItem('painoptix_failed_operations', JSON.stringify(failures));
    
    logger.info('Successfully retried failed operation', {
      failureId,
      operation: failure.operation
    });
    
    return true;
  } catch (error) {
    // Update retry count
    failure.retryCount++;
    failure.lastRetryAt = new Date().toISOString();
    failure.lastRetryError = error instanceof Error ? error.message : error;
    
    localStorage.setItem('painoptix_failed_operations', JSON.stringify(failures));
    
    logger.error('Failed to retry operation', {
      failureId,
      operation: failure.operation,
      retryCount: failure.retryCount,
      error
    });
    
    return false;
  }
}

/**
 * Clear old failed operations (older than 7 days)
 */
export function clearOldFailures(): number {
  const failures = getStoredFailures();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const filtered = failures.filter(f => 
    new Date(f.timestamp) > oneWeekAgo
  );
  
  const removed = failures.length - filtered.length;
  
  if (removed > 0) {
    localStorage.setItem('painoptix_failed_operations', JSON.stringify(filtered));
    logger.info(`Cleared ${removed} old failed operations`);
  }
  
  return removed;
}

/**
 * Wrap a function with error recovery
 */
export function withErrorRecovery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    operation: string;
    onError?: (error: any, errorCode: string) => void;
    fallback?: (...args: Parameters<T>) => ReturnType<T>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const errorCode = generateErrorCode();
    
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error in ${options.operation}`, {
        error,
        errorCode,
        args: args.length > 0 ? args : undefined
      });
      
      if (options.onError) {
        options.onError(error, errorCode);
      }
      
      if (options.fallback) {
        logger.info(`Using fallback for ${options.operation}`);
        return options.fallback(...args);
      }
      
      throw createRecoverableError(
        `Operation failed: ${options.operation}`,
        error,
        { errorCode, operation: options.operation }
      );
    }
  }) as T;
}