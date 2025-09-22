import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { metrics } from "@/lib/metrics";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    // Basic auth check for metrics endpoint
    if (process.env.METRICS_TOKEN) {
      if (authHeader !== `Bearer ${process.env.METRICS_TOKEN}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Collect latest metrics
    const supabase = getServiceSupabase();
    await Promise.all([
      metrics.collectSystemMetrics(),
      metrics.collectBusinessMetrics(supabase, logger),
    ]);

    // Check accept header for format
    const acceptHeader = headersList.get("accept") || "";

    if (acceptHeader.includes("application/json")) {
      // Return JSON format
      const metricsData = metrics.getMetrics();
      const jsonMetrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        counters: Object.fromEntries(metricsData.counters),
        gauges: Object.fromEntries(metricsData.metrics),
        histograms: Object.fromEntries(
          Array.from(metricsData.histograms).map(([key, values]) => {
            const sorted = [...values].sort((a, b) => a - b);
            return [
              key,
              {
                count: values.length,
                sum: values.reduce((a, b) => a + b, 0),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                min: sorted[0] || 0,
                max: sorted[sorted.length - 1] || 0,
                p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
                p90: sorted[Math.floor(sorted.length * 0.9)] || 0,
                p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
                p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
              },
            ];
          }),
        ),
      };

      return NextResponse.json(jsonMetrics);
    } else {
      // Return Prometheus format (default)
      const response = new NextResponse(metrics.formatPrometheus());
      response.headers.set("Content-Type", "text/plain; version=0.0.4");
      return response;
    }
  } catch (error) {
    logger.error("Metrics endpoint error", error as Error);

    return NextResponse.json(
      {
        error: "Failed to collect metrics",
      },
      { status: 500 },
    );
  }
}
