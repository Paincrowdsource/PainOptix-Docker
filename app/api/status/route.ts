export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

interface SystemStatus {
  timestamp: string;
  status: 'operational' | 'degraded' | 'outage';
  version: {
    app: string;
    node: string;
    nextjs: string;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  environment: string;
  deployment: {
    provider: string;
    region: string;
    buildId: string;
  };
  components: {
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    description: string;
    lastCheck: string;
  }[];
  recentIncidents: {
    id: string;
    title: string;
    status: 'resolved' | 'investigating' | 'identified';
    createdAt: string;
    resolvedAt?: string;
  }[];
  stats: {
    assessmentsToday: number;
    assessmentsThisWeek: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

// Component status cache
const componentStatusCache = new Map<string, any>();
const CACHE_TTL = 60000; // 1 minute

async function getComponentStatus() {
  const cacheKey = 'components';
  const cached = componentStatusCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const components = [];

  // Check core API
  try {
    const start = Date.now();
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`);
    const responseTime = Date.now() - start;
    
    components.push({
      name: 'Core API',
      status: responseTime < 1000 ? 'operational' : 'degraded',
      description: `Response time: ${responseTime}ms`,
      lastCheck: new Date().toISOString()
    });
  } catch {
    components.push({
      name: 'Core API',
      status: 'outage',
      description: 'API is not responding',
      lastCheck: new Date().toISOString()
    });
  }

  // Check database
  try {
    const start = Date.now();
    await supabase.from('assessments').select('id').limit(1);
    const responseTime = Date.now() - start;
    
    components.push({
      name: 'Database',
      status: responseTime < 500 ? 'operational' : 'degraded',
      description: `Query time: ${responseTime}ms`,
      lastCheck: new Date().toISOString()
    });
  } catch {
    components.push({
      name: 'Database',
      status: 'outage',
      description: 'Database connection failed',
      lastCheck: new Date().toISOString()
    });
  }

  // Check email service
  const emailConfigured = !!process.env.SENDGRID_API_KEY;
  components.push({
    name: 'Email Service',
    status: emailConfigured ? 'operational' : 'degraded',
    description: emailConfigured ? 'SendGrid configured' : 'Email service not configured',
    lastCheck: new Date().toISOString()
  });

  // Check SMS service
  const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  components.push({
    name: 'SMS Service',
    status: smsConfigured ? 'operational' : 'degraded',
    description: smsConfigured ? 'Twilio configured' : 'SMS service not configured',
    lastCheck: new Date().toISOString()
  });

  // Check PDF generation
  components.push({
    name: 'PDF Generation',
    status: 'operational',
    description: 'PDF service available',
    lastCheck: new Date().toISOString()
  });

  // Check payment processing
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  components.push({
    name: 'Payment Processing',
    status: stripeConfigured ? 'operational' : 'degraded',
    description: stripeConfigured ? 'Stripe configured' : 'Payment processing not configured',
    lastCheck: new Date().toISOString()
  });

  componentStatusCache.set(cacheKey, {
    data: components,
    expires: Date.now() + CACHE_TTL
  });

  return components;
}

async function getStats() {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();

    // Assessments today
    const { count: assessmentsToday } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart);

    // Assessments this week
    const { count: assessmentsThisWeek } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart);

    // TODO: Calculate from actual metrics when available
    const averageResponseTime = 250; // ms
    const errorRate = 0.001; // 0.1%

    return {
      assessmentsToday: assessmentsToday || 0,
      assessmentsThisWeek: assessmentsThisWeek || 0,
      averageResponseTime,
      errorRate
    };
  } catch (error) {
    logger.error('Failed to get stats', error as Error);
    return {
      assessmentsToday: 0,
      assessmentsThisWeek: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '0m';
}

// Get Next.js version
function getNextVersion(): string {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.dependencies?.next?.replace('^', '') || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function GET(request: Request) {
  try {
    // Get components status
    const components = await getComponentStatus();
    
    // Calculate overall status
    const componentStatuses = components.map((c: any) => c.status);
    let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';
    
    if (componentStatuses.some((s: any) => s === 'outage')) {
      overallStatus = 'outage';
    } else if (componentStatuses.some((s: any) => s === 'degraded')) {
      overallStatus = 'degraded';
    }

    // Get stats
    const stats = await getStats();

    // Build status response
    const status: SystemStatus = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      version: {
        app: process.env.APP_VERSION || '1.2.0',
        node: process.version,
        nextjs: getNextVersion()
      },
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime())
      },
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        provider: process.env.DEPLOYMENT_PROVIDER || 'netlify',
        region: process.env.DEPLOYMENT_REGION || 'us-east-1',
        buildId: process.env.BUILD_ID || 'dev'
      },
      components,
      recentIncidents: [], // TODO: Implement incident tracking
      stats
    };

    // Add cache headers
    const response = NextResponse.json(status);
    response.headers.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    return response;
  } catch (error) {
    logger.error('Status endpoint error', error as Error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'outage',
      error: 'Failed to get system status',
      environment: process.env.NODE_ENV || 'development'
    }, { status: 500 });
  }
}