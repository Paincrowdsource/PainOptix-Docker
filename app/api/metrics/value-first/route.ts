import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/value-first
 *
 * Returns value-first implementation metrics including:
 * - Summary statistics (7-day and 30-day)
 * - Daily breakdown
 * - Time on results screen metrics
 *
 * Query parameters:
 * - days: Number of days for daily breakdown (default: 14, max: 90)
 * - format: 'json' or 'text' (default: 'json')
 */
export async function GET(request: Request) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '14'), 90);
  const format = searchParams.get('format') || 'json';

  try {
    // Get summary metrics
    const { data: summary, error: summaryError } = await supabase
      .from('value_first_summary')
      .select('*')
      .single();

    if (summaryError) {
      return NextResponse.json(
        { error: 'Failed to fetch summary metrics', details: summaryError },
        { status: 500 }
      );
    }

    // Get daily metrics
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: daily, error: dailyError } = await supabase
      .from('value_first_metrics')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: false })
      .limit(days);

    if (dailyError) {
      return NextResponse.json(
        { error: 'Failed to fetch daily metrics', details: dailyError },
        { status: 500 }
      );
    }

    // Get recent session times for analysis
    const { data: sessionTimes, error: timesError } = await supabase
      .from('value_first_session_times')
      .select('*')
      .gte('viewed_at', startDate)
      .not('clicked_at', 'is', null)
      .order('viewed_at', { ascending: false })
      .limit(100);

    if (timesError) {
      return NextResponse.json(
        { error: 'Failed to fetch session times', details: timesError },
        { status: 500 }
      );
    }

    const response = {
      summary,
      daily,
      sessionTimes: sessionTimes || [],
      metadata: {
        generatedAt: new Date().toISOString(),
        daysIncluded: days,
        baseline: {
          emailCaptureRate: 36,
          target: 55,
          notes: 'Baseline: 36% email capture before value-first implementation. Target: 55%'
        }
      }
    };

    // Return as plain text if requested
    if (format === 'text') {
      const s = summary as any;
      const text = `
VALUE-FIRST IMPLEMENTATION METRICS
Generated: ${new Date().toISOString()}

LAST 7 DAYS
─────────────────────────────────────────
Assessments Completed:     ${s.last_7d_assessments || 0}
Results Preview Shown:     ${s.last_7d_results_viewed || 0} (${s.last_7d_results_view_rate || 0}%)
CTA Clicked:               ${s.last_7d_cta_clicked || 0} (${s.last_7d_cta_click_rate || 0}%)
Emails Captured:           ${s.last_7d_emails_captured || 0} (${s.last_7d_email_capture_rate || 0}%)
Overall Conversion:        ${s.last_7d_overall_conversion || 0}%

LAST 30 DAYS
─────────────────────────────────────────
Assessments Completed:     ${s.last_30d_assessments || 0}
Results Preview Shown:     ${s.last_30d_results_viewed || 0} (${s.last_30d_results_view_rate || 0}%)
CTA Clicked:               ${s.last_30d_cta_clicked || 0} (${s.last_30d_cta_click_rate || 0}%)
Emails Captured:           ${s.last_30d_emails_captured || 0} (${s.last_30d_email_capture_rate || 0}%)
Overall Conversion:        ${s.last_30d_overall_conversion || 0}%

TIME ON RESULTS SCREEN
─────────────────────────────────────────
Average Time:              ${s.avg_time_on_results_seconds ? Math.round(s.avg_time_on_results_seconds) : 0}s
Median Time:               ${s.median_time_on_results_seconds ? Math.round(s.median_time_on_results_seconds) : 0}s
Sessions Measured:         ${s.sessions_with_time_data || 0}

PROGRESS VS BASELINE
─────────────────────────────────────────
Baseline Email Capture:    36%
Current Email Capture:     ${s.last_7d_overall_conversion || 0}%
Target:                    55%
Status:                    ${s.last_7d_overall_conversion >= 55 ? '✅ TARGET MET' : s.last_7d_overall_conversion > 36 ? '📈 IMPROVING' : '⚠️ BELOW BASELINE'}
      `.trim();

      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching value-first metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
