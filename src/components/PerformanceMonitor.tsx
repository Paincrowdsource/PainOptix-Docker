'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { performanceMonitor, measureRouteChange } from '@/lib/performance';

export function PerformanceMonitor() {
  const router = useRouter();

  useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      // Report Web Vitals
      if ('web-vital' in window) {
        // @ts-ignore
        window.addEventListener('web-vital', (event: any) => {
          const { name, value, rating } = event.detail;
          performanceMonitor.recordMetric(name.toLowerCase(), value, 'ms', { rating });
        });
      }

      // Monitor page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden) {
          performanceMonitor.recordMetric('page-hidden', 1, 'event');
        } else {
          performanceMonitor.recordMetric('page-visible', 1, 'event');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Monitor memory usage (if available)
      if ('memory' in performance) {
        const checkMemory = () => {
          const memory = (performance as any).memory;
          performanceMonitor.recordMetric('memory-used', memory.usedJSHeapSize, 'bytes');
          performanceMonitor.recordMetric('memory-total', memory.totalJSHeapSize, 'bytes');
        };
        
        // Check memory every 30 seconds
        const memoryInterval = setInterval(checkMemory, 30000);
        
        return () => {
          clearInterval(memoryInterval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  // Monitor route changes - not available in App Router
  // Route change monitoring would need to be implemented differently in Next.js 13+

  return null; // This component doesn't render anything
}

// Hook to use in components
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    performanceMonitor.startTimer(`component-${componentName}`);
    
    return () => {
      performanceMonitor.endTimer(`component-${componentName}`);
    };
  }, [componentName]);
}