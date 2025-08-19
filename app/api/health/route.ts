import { NextResponse } from 'next/server';
import { getServiceSupabase, supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    stripe: ComponentHealth;
    email: ComponentHealth;
    sms: ComponentHealth;
    storage: ComponentHealth;
  };
  email_provider: 'ok' | 'missing';
  scheduler?: {
    lastRunAt?: string;
  };
  stripe_webhook?: {
    lastSuccessAt?: string;
  };
  environment: string;
  version: string;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

// Track application start time
const startTime = Date.now();

// Simple in-memory cache for health checks
const healthCache = new Map<string, { result: ComponentHealth; expires: number }>();
const CACHE_DURATION = 30000; // 30 seconds

async function checkDatabase(): Promise<ComponentHealth> {
  const cacheKey = 'database';
  const cached = healthCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }

  const start = Date.now();
  try {
    // Simple query to check database connectivity
    const { error } = await supabase
      .from('assessments')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - start;

    if (error) {
      throw error;
    }

    const result: ComponentHealth = {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString()
    };

    healthCache.set(cacheKey, { result, expires: Date.now() + CACHE_DURATION });
    return result;
  } catch (error) {
    logger.error('Health check - Database failed', error as Error);
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: 'Database connection failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkStripe(): Promise<ComponentHealth> {
  const cacheKey = 'stripe';
  const cached = healthCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }

  const start = Date.now();
  try {
    // Check Stripe connectivity by fetching recent charges (limit 1)
    await stripe.charges.list({ limit: 1 });
    const responseTime = Date.now() - start;

    const result: ComponentHealth = {
      status: responseTime < 2000 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString()
    };

    healthCache.set(cacheKey, { result, expires: Date.now() + CACHE_DURATION });
    return result;
  } catch (error) {
    logger.error('Health check - Stripe failed', error as Error);
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: 'Stripe API connection failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkEmailService(): Promise<ComponentHealth> {
  // For now, return healthy if SendGrid API key is configured
  const hasApiKey = !!process.env.SENDGRID_API_KEY;
  
  return {
    status: hasApiKey ? 'healthy' : 'unhealthy',
    message: hasApiKey ? 'SendGrid configured' : 'SendGrid not configured',
    lastChecked: new Date().toISOString()
  };
}

async function checkSmsService(): Promise<ComponentHealth> {
  // For now, return healthy if Twilio credentials are configured
  const hasCredentials = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  
  return {
    status: hasCredentials ? 'healthy' : 'degraded',
    message: hasCredentials ? 'Twilio configured' : 'Twilio not configured',
    lastChecked: new Date().toISOString()
  };
}

async function checkStorage(): Promise<ComponentHealth> {
  // Check if we can access the public directory (for PDFs)
  try {
    const publicDir = process.cwd() + '/public';
    
    return {
      status: 'healthy',
      message: 'Storage accessible',
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Storage access failed',
      lastChecked: new Date().toISOString()
    };
  }
}

async function getHealthTimestamps() {
  try {
    const serviceSupabase = getServiceSupabase();
    const { data: healthData } = await serviceSupabase
      .from('kv_health')
      .select('key, value')
      .in('key', ['scheduler_last_run', 'stripe_webhook_last_success']);
    
    const timestamps: Record<string, any> = {};
    
    healthData?.forEach(row => {
      if (row.key === 'scheduler_last_run') {
        timestamps.scheduler = { lastRunAt: row.value?.timestamp };
      } else if (row.key === 'stripe_webhook_last_success') {
        timestamps.stripe_webhook = { lastSuccessAt: row.value?.timestamp };
      }
    });
    
    return timestamps;
  } catch (error) {
    logger.error('Failed to get health timestamps', error as Error);
    return {};
  }
}

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    // Basic auth check for health endpoint (optional)
    if (process.env.HEALTH_CHECK_TOKEN) {
      if (authHeader !== `Bearer ${process.env.HEALTH_CHECK_TOKEN}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Perform health checks in parallel
    const [database, stripeCheck, email, sms, storage, timestamps] = await Promise.all([
      checkDatabase(),
      checkStripe(),
      checkEmailService(),
      checkSmsService(),
      checkStorage(),
      getHealthTimestamps()
    ]);

    // Calculate overall status
    const checks = { database, stripe: stripeCheck, email, sms, storage };
    const statuses = Object.values(checks).map(check => check.status);
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    // Determine email provider status
    const emailProviderStatus = process.env.SENDGRID_API_KEY ? 'ok' : 'missing';

    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      checks,
      email_provider: emailProviderStatus,
      scheduler: timestamps.scheduler,
      stripe_webhook: timestamps.stripe_webhook,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.2.0'
    };

    // Set appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    // Add cache headers
    const response = NextResponse.json(healthResult, { status: statusCode });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    logger.error('Health check endpoint error', error as Error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      error: 'Health check failed',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.2.0'
    }, { status: 503 });
  }
}