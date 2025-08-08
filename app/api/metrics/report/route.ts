import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

interface MetricReport {
  metrics: Array<{
    name: string;
    value: number;
    unit: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
  summary: Record<string, any>;
  userAgent: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const report: MetricReport = await request.json();
    const requestId = request.headers.get('x-request-id');
    
    // Log performance data
    logger.info('Client performance metrics received', {
      requestId,
      userAgent: report.userAgent,
      summary: report.summary
    });

    // Track critical web vitals in server metrics
    if (report.summary.lcp) {
      metrics.recordHistogram('client_lcp_ms', report.summary.lcp.median);
    }
    if (report.summary.fid) {
      metrics.recordHistogram('client_fid_ms', report.summary.fid.median);
    }
    if (report.summary.cls) {
      metrics.setGauge('client_cls_score', report.summary.cls.median);
    }

    // Track API performance
    Object.entries(report.summary).forEach(([name, stats]: [string, any]) => {
      if (name.startsWith('api-')) {
        metrics.recordHistogram('client_api_duration_ms', stats.median, {
          endpoint: name.replace('api-', '')
        });
      }
    });

    // Track route changes
    if (report.summary['route-change']) {
      metrics.recordHistogram('client_route_change_ms', report.summary['route-change'].median);
    }

    // Store detailed metrics for analysis (in production, send to analytics service)
    if (process.env.NODE_ENV === 'development') {
      report.metrics.forEach(metric => {
        if (metric.name === 'long-task') {
          logger.warn('Long task detected on client', {
            duration: metric.value,
            metadata: metric.metadata
          });
        }
      });
    }

    // Send to external monitoring service if configured
    if (process.env.MONITORING_ENDPOINT) {
      // Forward to monitoring service
      fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'painoptix-frontend',
          metrics: report
        })
      }).catch(error => {
        logger.error('Failed to forward metrics to monitoring service', error);
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Metrics received' 
    });
  } catch (error) {
    logger.error('Failed to process performance metrics', error as Error);
    
    return NextResponse.json({ 
      error: 'Failed to process metrics' 
    }, { 
      status: 500 
    });
  }
}