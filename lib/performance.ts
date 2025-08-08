/**
 * Performance monitoring utilities
 * Tracks client-side and server-side performance metrics
 */

import { logger } from './logger';

// Performance observer for client-side metrics
let performanceObserver: PerformanceObserver | null = null;

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private reportInterval: number = 30000; // 30 seconds
  private reportTimer: NodeJS.Timeout | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeClientMonitoring();
    }
  }

  // Initialize client-side performance monitoring
  private initializeClientMonitoring() {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      try {
        // Observe Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('lcp', lastEntry.startTime, 'ms', {
            element: lastEntry.element?.tagName,
            url: lastEntry.url
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('fid', entry.processingStart - entry.startTime, 'ms', {
              eventType: entry.name
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Observe Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.recordMetric('cls', clsValue, 'score');
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('navigation', entry.loadEventEnd - entry.fetchStart, 'ms', {
              type: entry.type,
              redirectCount: entry.redirectCount
            });
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });

      } catch (error) {
        logger.error('Failed to initialize performance monitoring', error);
      }
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('long-task', entry.duration, 'ms', {
            startTime: entry.startTime,
            name: entry.name
          });
        });
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task timing might not be supported
      }
    }

    // Start periodic reporting
    this.startReporting();
  }

  // Start a performance timer
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End a timer and record the metric
  endTimer(name: string, metadata?: Record<string, any>): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer ${name} was not started`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    this.recordMetric(name, duration, 'ms', metadata);
    return duration;
  }

  // Record a performance metric
  recordMetric(name: string, value: number, unit: string = 'ms', metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant metrics
    if (name === 'lcp' && value > 2500) {
      logger.warn('Poor LCP detected', { value, metadata });
    } else if (name === 'fid' && value > 100) {
      logger.warn('Poor FID detected', { value, metadata });
    } else if (name === 'cls' && value > 0.1) {
      logger.warn('Poor CLS detected', { value, metadata });
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics summary
  getMetricsSummary() {
    const summary: Record<string, any> = {};
    
    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(grouped).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      summary[name] = {
        count: values.length,
        mean: sum / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        min: sorted[0],
        max: sorted[sorted.length - 1]
      };
    });

    return summary;
  }

  // Start periodic reporting
  private startReporting() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      this.reportMetrics();
    }, this.reportInterval);
  }

  // Report metrics to server
  private async reportMetrics() {
    if (this.metrics.length === 0) return;

    const summary = this.getMetricsSummary();
    
    try {
      await fetch('/api/metrics/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics.slice(-100), // Send last 100 metrics
          summary,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });
      
      // Clear reported metrics
      this.metrics = [];
    } catch (error) {
      logger.error('Failed to report metrics', error);
    }
  }

  // Clean up
  destroy() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
    if (performanceObserver) {
      performanceObserver.disconnect();
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = performanceMonitor;

  const measureComponent = (componentName: string) => {
    monitor.startTimer(`component-${componentName}`);
    
    return () => {
      monitor.endTimer(`component-${componentName}`);
    };
  };

  const measureApiCall = async <T>(
    apiName: string, 
    apiCall: () => Promise<T>
  ): Promise<T> => {
    monitor.startTimer(`api-${apiName}`);
    
    try {
      const result = await apiCall();
      const duration = monitor.endTimer(`api-${apiName}`, { status: 'success' });
      
      if (duration && duration > 1000) {
        logger.warn(`Slow API call detected: ${apiName}`, { duration });
      }
      
      return result;
    } catch (error) {
      monitor.endTimer(`api-${apiName}`, { status: 'error' });
      throw error;
    }
  };

  return {
    measureComponent,
    measureApiCall,
    recordMetric: monitor.recordMetric.bind(monitor),
    startTimer: monitor.startTimer.bind(monitor),
    endTimer: monitor.endTimer.bind(monitor)
  };
}

// Utility to measure route changes in Next.js
export function measureRouteChange(router: any) {
  const handleRouteChangeStart = (url: string) => {
    performanceMonitor.startTimer('route-change');
    logger.debug('Route change started', { url });
  };

  const handleRouteChangeComplete = (url: string) => {
    const duration = performanceMonitor.endTimer('route-change', { url });
    if (duration && duration > 500) {
      logger.warn('Slow route change detected', { url, duration });
    }
  };

  const handleRouteChangeError = (err: any, url: string) => {
    performanceMonitor.endTimer('route-change', { url, error: true });
    logger.error('Route change error', err, { url });
  };

  router.events.on('routeChangeStart', handleRouteChangeStart);
  router.events.on('routeChangeComplete', handleRouteChangeComplete);
  router.events.on('routeChangeError', handleRouteChangeError);

  return () => {
    router.events.off('routeChangeStart', handleRouteChangeStart);
    router.events.off('routeChangeComplete', handleRouteChangeComplete);
    router.events.off('routeChangeError', handleRouteChangeError);
  };
}

// Server-side performance utilities
export function createServerTimings() {
  const timings: Record<string, number> = {};
  const startTimes: Record<string, number> = {};

  return {
    start(name: string) {
      startTimes[name] = Date.now();
    },
    
    end(name: string) {
      const startTime = startTimes[name];
      if (startTime) {
        timings[name] = Date.now() - startTime;
        delete startTimes[name];
      }
    },
    
    getHeader(): string {
      return Object.entries(timings)
        .map(([name, duration]) => `${name};dur=${duration}`)
        .join(', ');
    },
    
    getTimings(): Record<string, number> {
      return { ...timings };
    }
  };
}

// Web Vitals thresholds
export const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 }
};

// Get rating for a metric value
export function getMetricRating(
  metricName: string, 
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metricName as keyof typeof WEB_VITALS_THRESHOLDS];
  
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}