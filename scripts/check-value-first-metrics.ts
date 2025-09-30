#!/usr/bin/env tsx
/**
 * Check Value-First Implementation Metrics
 *
 * This script queries the value-first metrics views to show conversion funnel performance.
 * Run with: npx tsx scripts/check-value-first-metrics.ts
 *
 * Metrics tracked:
 * 1. Results View Rate: % of completed assessments that see results preview
 * 2. CTA Click Rate: % of results views that click "Get My Complete Guide"
 * 3. Email Capture Rate: % of CTA clicks that provide email/phone
 * 4. Overall Conversion: % of assessments that convert to email capture
 * 5. Time on Results Screen: Average/median time spent viewing results
 */

import { getServiceSupabase } from '../lib/supabase';

interface ValueFirstSummary {
  // 7-day metrics
  last_7d_assessments: number | null;
  last_7d_results_viewed: number | null;
  last_7d_cta_clicked: number | null;
  last_7d_emails_captured: number | null;
  last_7d_results_view_rate: number | null;
  last_7d_cta_click_rate: number | null;
  last_7d_email_capture_rate: number | null;
  last_7d_overall_conversion: number | null;

  // 30-day metrics
  last_30d_assessments: number | null;
  last_30d_results_viewed: number | null;
  last_30d_cta_clicked: number | null;
  last_30d_emails_captured: number | null;
  last_30d_results_view_rate: number | null;
  last_30d_cta_click_rate: number | null;
  last_30d_email_capture_rate: number | null;
  last_30d_overall_conversion: number | null;

  // Time metrics
  avg_time_on_results_seconds: number | null;
  median_time_on_results_seconds: number | null;
  sessions_with_time_data: number | null;
}

interface DailyMetrics {
  date: string;
  assessments_completed: number;
  results_viewed: number;
  results_view_rate_pct: number;
  cta_clicked: number;
  cta_click_rate_pct: number;
  emails_captured: number;
  email_capture_rate_pct: number;
  overall_conversion_rate_pct: number;
}

async function checkMetrics() {
  const supabase = getServiceSupabase();

  console.log('========================================');
  console.log('VALUE-FIRST IMPLEMENTATION METRICS');
  console.log('========================================\n');

  // Get summary metrics
  const { data: summary, error: summaryError } = await supabase
    .from('value_first_summary')
    .select('*')
    .single();

  if (summaryError) {
    console.error('Error fetching summary:', summaryError);
    process.exit(1);
  }

  const s = summary as ValueFirstSummary;

  // Display 7-day metrics
  console.log('📊 LAST 7 DAYS');
  console.log('─────────────────────────────────────────');
  console.log(`Assessments Completed:     ${s.last_7d_assessments || 0}`);
  console.log(`Results Preview Shown:     ${s.last_7d_results_viewed || 0} (${s.last_7d_results_view_rate || 0}%)`);
  console.log(`CTA Clicked:               ${s.last_7d_cta_clicked || 0} (${s.last_7d_cta_click_rate || 0}%)`);
  console.log(`Emails Captured:           ${s.last_7d_emails_captured || 0} (${s.last_7d_email_capture_rate || 0}%)`);
  console.log(`Overall Conversion:        ${s.last_7d_overall_conversion || 0}%`);

  const targetRate = 55;
  const currentRate = s.last_7d_overall_conversion || 0;
  const baseline = 36;

  if (currentRate >= targetRate) {
    console.log(`✅ TARGET MET! (${targetRate}% goal achieved)`);
  } else if (currentRate > baseline) {
    console.log(`📈 IMPROVING (was ${baseline}%, now ${currentRate}%, target ${targetRate}%)`);
  } else {
    console.log(`⚠️  BELOW BASELINE (current ${currentRate}%, baseline ${baseline}%, target ${targetRate}%)`);
  }

  console.log('');

  // Display 30-day metrics
  console.log('📊 LAST 30 DAYS');
  console.log('─────────────────────────────────────────');
  console.log(`Assessments Completed:     ${s.last_30d_assessments || 0}`);
  console.log(`Results Preview Shown:     ${s.last_30d_results_viewed || 0} (${s.last_30d_results_view_rate || 0}%)`);
  console.log(`CTA Clicked:               ${s.last_30d_cta_clicked || 0} (${s.last_30d_cta_click_rate || 0}%)`);
  console.log(`Emails Captured:           ${s.last_30d_emails_captured || 0} (${s.last_30d_email_capture_rate || 0}%)`);
  console.log(`Overall Conversion:        ${s.last_30d_overall_conversion || 0}%`);
  console.log('');

  // Display time metrics
  console.log('⏱️  TIME ON RESULTS SCREEN');
  console.log('─────────────────────────────────────────');
  if (s.sessions_with_time_data && s.sessions_with_time_data > 0) {
    console.log(`Average Time:              ${s.avg_time_on_results_seconds ? Math.round(s.avg_time_on_results_seconds) : 0}s`);
    console.log(`Median Time:               ${s.median_time_on_results_seconds ? Math.round(s.median_time_on_results_seconds) : 0}s`);
    console.log(`Sessions Measured:         ${s.sessions_with_time_data}`);
  } else {
    console.log('No time data available yet');
  }
  console.log('');

  // Get daily breakdown for last 14 days
  const { data: daily, error: dailyError } = await supabase
    .from('value_first_metrics')
    .select('*')
    .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(14);

  if (dailyError) {
    console.error('Error fetching daily metrics:', dailyError);
  } else if (daily && daily.length > 0) {
    console.log('📅 DAILY BREAKDOWN (Last 14 Days)');
    console.log('─────────────────────────────────────────');
    console.log('Date       | Assess | Results | CTA  | Email | Conv%');
    console.log('-----------|--------|---------|------|-------|------');

    (daily as DailyMetrics[]).forEach(d => {
      const date = new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      console.log(
        `${date.padEnd(10)} | ` +
        `${String(d.assessments_completed || 0).padEnd(6)} | ` +
        `${String(d.results_viewed || 0).padEnd(7)} | ` +
        `${String(d.cta_clicked || 0).padEnd(4)} | ` +
        `${String(d.emails_captured || 0).padEnd(5)} | ` +
        `${(d.overall_conversion_rate_pct || 0).toFixed(1)}%`
      );
    });
  }

  console.log('\n========================================');
  console.log('💡 INTERPRETATION GUIDE');
  console.log('========================================');
  console.log('Results View Rate:   Should be ~100% (everyone sees results)');
  console.log('CTA Click Rate:      High rate = good value proposition');
  console.log('Email Capture Rate:  Target 55%+ (was 36% baseline)');
  console.log('Overall Conversion:  End-to-end success metric');
  console.log('Time on Screen:      20-60s ideal (enough to read, not bouncing)');
  console.log('========================================\n');
}

// Run the script
checkMetrics().catch(console.error);