import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as dateFns from 'date-fns';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const timeRange = searchParams.get('range') || '24h';
    const level = searchParams.get('level') || 'all';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build query
    let query = supabase
      .from('system_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (level !== 'all') {
      query = query.eq('level', level);
    }

    const { data: logs, error } = await query;

    if (error) {
      logger.error('Failed to export logs', error);
      return NextResponse.json({ error: 'Failed to export logs' }, { status: 500 });
    }

    // Log the export action
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'export_logs',
      resource_type: 'system_logs',
      metadata: { format, timeRange, level, count: logs?.length || 0 }
    });

    if (format === 'json') {
      // Return as JSON
      return NextResponse.json({
        exported_at: new Date().toISOString(),
        time_range: { start: startDate.toISOString(), end: now.toISOString() },
        filters: { level },
        count: logs?.length || 0,
        logs: logs || []
      });
    } else {
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'Level',
        'Message',
        'Service',
        'User Email',
        'Request ID',
        'Error Stack',
        'Metadata'
      ];

      const csvRows = logs?.map((log: any) => [
        dateFns.format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.level,
        `"${log.message.replace(/"/g, '""')}"`,
        log.service || '',
        '',
        log.request_id || '',
        log.error_stack ? `"${log.error_stack.replace(/"/g, '""')}"` : '',
        log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
      ]) || [];

      const csv = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Return as CSV download
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="logs-${dateFns.format(now, 'yyyyMMdd-HHmmss')}.csv"`
        }
      });
    }
  } catch (error) {
    logger.error('Error exporting logs', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support POST for exporting audit logs
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const body = await request.json();
    const { logType = 'audit', timeRange = '7d' } = body;

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

    // Export audit logs
    const { data: auditLogs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to export audit logs', error);
      return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 });
    }

    // Generate CSV for audit logs
    const csvHeaders = [
      'Timestamp',
      'Admin Email',
      'Action',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'User Agent',
      'Metadata'
    ];

    const csvRows = auditLogs?.map((log: any) => [
      dateFns.format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'Unknown',
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.ip_address || '',
      log.user_agent ? `"${log.user_agent.replace(/"/g, '""')}"` : '',
      log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
    ]) || [];

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Log the export action
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'export_audit_logs',
      resource_type: 'audit_logs',
      metadata: { timeRange, count: auditLogs?.length || 0 }
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${dateFns.format(now, 'yyyyMMdd-HHmmss')}.csv"`
      }
    });
  } catch (error) {
    logger.error('Error exporting audit logs', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}