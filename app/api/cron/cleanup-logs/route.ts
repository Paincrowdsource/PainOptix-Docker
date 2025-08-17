export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Create a service role client for cron jobs
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

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting log cleanup cron job');

    // Call the cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_old_logs');

    if (cleanupError) {
      logger.error('Failed to cleanup logs', cleanupError);
      return NextResponse.json({ 
        error: 'Failed to cleanup logs',
        details: cleanupError.message 
      }, { status: 500 });
    }

    // Get cleanup statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count remaining logs
    const { count: remainingLogs } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true });

    const { count: remainingMetrics } = await supabase
      .from('performance_metrics')
      .select('*', { count: 'exact', head: true });

    logger.info('Log cleanup completed', {
      remainingLogs,
      remainingMetrics,
      cleanupBefore: {
        logs: thirtyDaysAgo.toISOString(),
        metrics: sevenDaysAgo.toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Logs cleaned successfully',
      stats: {
        remainingLogs,
        remainingMetrics,
        cleanedBefore: {
          logs: thirtyDaysAgo.toISOString(),
          metrics: sevenDaysAgo.toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Cron job error', error as Error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Also support POST for manual triggering by admins
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the user is an admin using their session token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Log admin action
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'manual_log_cleanup',
      resource_type: 'system_logs',
      metadata: { triggered_at: new Date().toISOString() }
    });

    // Perform cleanup
    const { error: cleanupError } = await supabase.rpc('cleanup_old_logs');

    if (cleanupError) {
      logger.error('Manual cleanup failed', cleanupError);
      return NextResponse.json({ 
        error: 'Failed to cleanup logs',
        details: cleanupError.message 
      }, { status: 500 });
    }

    logger.info('Manual log cleanup triggered', { admin_id: user.id });

    return NextResponse.json({
      success: true,
      message: 'Manual cleanup completed successfully'
    });
  } catch (error) {
    logger.error('Manual cleanup error', error as Error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}