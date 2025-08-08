import Transport from 'winston-transport';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger as fallbackLogger } from './logger';

interface LogEntry {
  level: string;
  message: string;
  metadata?: any;
  request_id?: string;
  user_id?: string;
  error_stack?: string;
  service?: string;
}

export class SupabaseTransport extends Transport {
  private supabase: SupabaseClient;
  private batchSize = 10;
  private batchInterval = 5000; // 5 seconds
  private logBatch: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isClosing = false;

  constructor(opts?: any) {
    super(opts);
    
    // Initialize Supabase client with service role key for RLS bypass
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    
    // Start batch timer
    this.timer = setInterval(() => this.flush(), this.batchInterval);
    
    // Handle process termination
    process.on('SIGINT', () => this.close());
    process.on('SIGTERM', () => this.close());
  }

  async log(info: any, callback: Function) {
    if (this.isClosing) {
      callback();
      return;
    }

    // Extract relevant fields from Winston log info
    const logEntry: LogEntry = {
      level: info.level,
      message: info.message,
      metadata: this.cleanMetadata(info),
      request_id: info.requestId || info.request_id,
      user_id: info.userId || info.user_id,
      error_stack: info.stack || info.error?.stack,
      service: info.service || 'painoptix'
    };

    this.logBatch.push(logEntry);

    // Flush if batch is full
    if (this.logBatch.length >= this.batchSize) {
      await this.flush();
    }

    callback();
  }

  private cleanMetadata(info: any): any {
    // Remove circular references and sensitive data
    const { 
      level, 
      message, 
      timestamp, 
      service,
      requestId,
      request_id,
      userId,
      user_id,
      stack,
      error,
      password,
      token,
      authorization,
      cookie,
      ...metadata 
    } = info;

    // Clean error objects
    if (metadata.error && typeof metadata.error === 'object') {
      metadata.error = {
        message: metadata.error.message,
        name: metadata.error.name,
        code: metadata.error.code,
        statusCode: metadata.error.statusCode
      };
    }

    return metadata;
  }

  async flush() {
    if (this.logBatch.length === 0 || this.isClosing) return;
    
    const logs = [...this.logBatch];
    this.logBatch = [];

    try {
      // Transform logs to match database schema
      const dbLogs = logs.map(log => ({
        level: log.level,
        message: log.message,
        metadata: log.metadata || {},
        request_id: log.request_id,
        user_id: log.user_id,
        error_stack: log.error_stack,
        service: log.service
      }));

      const { error } = await this.supabase
        .from('system_logs')
        .insert(dbLogs);

      if (error) {
        // Use console as fallback to avoid infinite loop
        console.error('Failed to save logs to Supabase:', error);
        
        // Try to save error about logging failure
        await this.supabase
          .from('system_logs')
          .insert({
            level: 'error',
            message: 'Failed to save batch of logs',
            service: 'logger',
            metadata: { 
              error: error.message, 
              batch_size: logs.length 
            }
          });
      }
    } catch (error) {
      // Last resort fallback
      console.error('Critical: Failed to save logs:', error);
    }
  }

  close() {
    this.isClosing = true;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Final flush
    this.flush().finally(() => {
      this.emit('finish');
    });
  }
}

// Helper function to save performance metrics
export async function savePerformanceMetric(
  metricName: string, 
  value: number, 
  unit: string = 'ms',
  tags?: Record<string, any>
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    await supabase
      .from('performance_metrics')
      .insert({
        metric_name: metricName,
        value,
        unit,
        tags: tags || {}
      });
  } catch (error) {
    console.error('Failed to save performance metric:', error);
  }
}

// Batch performance metrics for efficiency
class MetricsBatcher {
  private metrics: Array<{
    metric_name: string;
    value: number;
    unit: string;
    tags: any;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    
    // Flush every 10 seconds
    this.timer = setInterval(() => this.flush(), 10000);
  }

  add(metricName: string, value: number, unit: string = 'ms', tags?: any) {
    this.metrics.push({
      metric_name: metricName,
      value,
      unit,
      tags: tags || {}
    });

    // Flush if we have too many metrics
    if (this.metrics.length >= 50) {
      this.flush();
    }
  }

  async flush() {
    if (this.metrics.length === 0) return;

    const batch = [...this.metrics];
    this.metrics = [];

    try {
      await this.supabase
        .from('performance_metrics')
        .insert(batch);
    } catch (error) {
      console.error('Failed to save metrics batch:', error);
    }
  }

  close() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

export const metricsBatcher = new MetricsBatcher();