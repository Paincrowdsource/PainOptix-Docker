// In-memory metrics storage (in production, use Redis or similar)
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, any> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private startTime = Date.now();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key)!.push(value);
    
    // Keep only last 1000 values to prevent memory issues
    const values = this.histograms.get(key)!;
    if (values.length > 1000) {
      values.shift();
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.metrics.set(key, { value, timestamp: Date.now() });
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  async collectSystemMetrics() {
    // Uptime
    this.setGauge('app_uptime_seconds', (Date.now() - this.startTime) / 1000);

    // Memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.setGauge('nodejs_memory_heap_used_bytes', memUsage.heapUsed);
      this.setGauge('nodejs_memory_heap_total_bytes', memUsage.heapTotal);
      this.setGauge('nodejs_memory_external_bytes', memUsage.external);
      this.setGauge('nodejs_memory_rss_bytes', memUsage.rss);
    }

    // Event loop lag (simplified)
    if (typeof process !== 'undefined' && process.hrtime && typeof setImmediate !== 'undefined') {
      const start = process.hrtime();
      setImmediate(() => {
        const lag = process.hrtime(start);
        const lagMs = lag[0] * 1000 + lag[1] / 1000000;
        this.recordHistogram('nodejs_eventloop_lag_ms', lagMs);
      });
    }
  }

  async collectBusinessMetrics(supabase: any, logger: any) {
    try {
      // Total assessments
      const { count: totalAssessments } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });
      
      this.setGauge('painoptix_assessments_total', totalAssessments || 0);

      // Assessments by payment tier
      const { data: tierCounts } = await supabase
        .from('assessments')
        .select('payment_tier')
        .not('payment_tier', 'is', null);

      if (tierCounts) {
        const tiers = tierCounts.reduce((acc: any, row: any) => {
          acc[row.payment_tier] = (acc[row.payment_tier] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        Object.entries(tiers).forEach(([tier, count]) => {
          this.setGauge('painoptix_assessments_by_tier', count as number, { tier });
        });
      }

      // Recent assessment completion rate (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { count: startedCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday);

      const { count: completedCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday)
        .not('selected_guide', 'is', null);

      if (startedCount && startedCount > 0) {
        const completionRate = (completedCount || 0) / startedCount;
        this.setGauge('painoptix_completion_rate_24h', completionRate);
      }

      // Failed email deliveries
      const { count: failedEmails } = await supabase
        .from('guide_deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      this.setGauge('painoptix_failed_deliveries_total', failedEmails || 0);

    } catch (error) {
      logger.error('Failed to collect business metrics', error as Error);
    }
  }

  formatPrometheus(): string {
    const lines: string[] = [];
    
    // Format counters
    this.counters.forEach((value, key) => {
      lines.push(`# TYPE ${key.split('{')[0]} counter`);
      lines.push(`${key} ${value}`);
    });

    // Format gauges
    this.metrics.forEach((data, key) => {
      lines.push(`# TYPE ${key.split('{')[0]} gauge`);
      lines.push(`${key} ${data.value}`);
    });

    // Format histograms
    this.histograms.forEach((values, key) => {
      const name = key.split('{')[0];
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      lines.push(`# TYPE ${name} histogram`);
      
      // Calculate percentiles
      const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
      const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
      
      lines.push(`${name}_bucket{le="50"} ${p50}`);
      lines.push(`${name}_bucket{le="90"} ${p90}`);
      lines.push(`${name}_bucket{le="95"} ${p95}`);
      lines.push(`${name}_bucket{le="99"} ${p99}`);
      lines.push(`${name}_sum ${sum}`);
      lines.push(`${name}_count ${values.length}`);
    });

    return lines.join('\n');
  }

  // Get internal state for JSON formatting
  getMetrics() {
    return {
      counters: this.counters,
      metrics: this.metrics,
      histograms: this.histograms
    };
  }
}

// Export singleton instance
export const metrics = MetricsCollector.getInstance();

// Helper to track API metrics
export function trackApiMetrics(
  method: string,
  path: string,
  statusCode: number,
  duration: number
) {
  metrics.incrementCounter('http_requests_total', 1, { method, path, status: statusCode.toString() });
  metrics.recordHistogram('http_request_duration_ms', duration, { method, path });
}

// Collect system metrics periodically (only on server)
if (typeof window === 'undefined') {
  setInterval(() => {
    metrics.collectSystemMetrics();
  }, 10000); // Every 10 seconds
}