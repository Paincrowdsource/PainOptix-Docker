'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target, Users, MousePointerClick, Mail } from 'lucide-react';

interface MetricsSummary {
  last_7d_assessments: number;
  last_7d_results_viewed: number;
  last_7d_cta_clicked: number;
  last_7d_emails_captured: number;
  last_7d_results_view_rate: number;
  last_7d_cta_click_rate: number;
  last_7d_email_capture_rate: number;
  last_7d_overall_conversion: number;

  last_30d_assessments: number;
  last_30d_results_viewed: number;
  last_30d_cta_clicked: number;
  last_30d_emails_captured: number;
  last_30d_results_view_rate: number;
  last_30d_cta_click_rate: number;
  last_30d_email_capture_rate: number;
  last_30d_overall_conversion: number;

  avg_time_on_results_seconds: number;
  median_time_on_results_seconds: number;
  sessions_with_time_data: number;
}

interface DailyMetric {
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

interface MetricsData {
  summary: MetricsSummary;
  daily: DailyMetric[];
  metadata: {
    generatedAt: string;
    daysIncluded: number;
    baseline: {
      emailCaptureRate: number;
      target: number;
      notes: string;
    };
  };
}

export default function ConversionMetricsClient() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics/value-first');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetricsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  if (error || !metricsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Metrics</h3>
            <p className="mt-1 text-sm text-red-700">{error || 'Unknown error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = metricsData.summary;
  const currentData = timeframe === '7d' ? {
    assessments: summary.last_7d_assessments,
    resultsViewed: summary.last_7d_results_viewed,
    ctaClicked: summary.last_7d_cta_clicked,
    emailsCaptured: summary.last_7d_emails_captured,
    resultsViewRate: summary.last_7d_results_view_rate,
    ctaClickRate: summary.last_7d_cta_click_rate,
    emailCaptureRate: summary.last_7d_email_capture_rate,
    overallConversion: summary.last_7d_overall_conversion,
  } : {
    assessments: summary.last_30d_assessments,
    resultsViewed: summary.last_30d_results_viewed,
    ctaClicked: summary.last_30d_cta_clicked,
    emailsCaptured: summary.last_30d_emails_captured,
    resultsViewRate: summary.last_30d_results_view_rate,
    ctaClickRate: summary.last_30d_cta_click_rate,
    emailCaptureRate: summary.last_30d_email_capture_rate,
    overallConversion: summary.last_30d_overall_conversion,
  };

  const baseline = metricsData.metadata.baseline.emailCaptureRate;
  const target = metricsData.metadata.baseline.target;
  const current = currentData.overallConversion;

  const getStatusBadge = () => {
    if (current >= target) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          Target Met ({target}%)
        </span>
      );
    } else if (current > baseline) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <TrendingUp className="h-4 w-4 mr-1" />
          Improving ({baseline}% → {current.toFixed(1)}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Below Baseline ({baseline}%)
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeframe === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              timeframe === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 30 Days
          </button>
        </div>
        {getStatusBadge()}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assessments Completed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assessments</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{currentData.assessments || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Completed assessments</p>
        </div>

        {/* Results Viewed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Results Viewed</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{currentData.resultsViewed || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">{currentData.resultsViewRate.toFixed(1)}% view rate</p>
        </div>

        {/* CTA Clicks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CTA Clicked</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{currentData.ctaClicked || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <MousePointerClick className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">{currentData.ctaClickRate.toFixed(1)}% click rate</p>
        </div>

        {/* Emails Captured */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Emails Captured</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{currentData.emailsCaptured || 0}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">{currentData.emailCaptureRate.toFixed(1)}% capture rate</p>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Conversion Funnel
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Assessment → Results View</span>
              <span className="text-sm font-semibold text-gray-900">{currentData.resultsViewRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentData.resultsViewRate, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Results View → CTA Click</span>
              <span className="text-sm font-semibold text-gray-900">{currentData.ctaClickRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentData.ctaClickRate, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">CTA Click → Email Capture</span>
              <span className="text-sm font-semibold text-gray-900">{currentData.emailCaptureRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentData.emailCaptureRate, 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">Overall: Assessment → Email</span>
              <span className="text-sm font-bold text-gray-900">{currentData.overallConversion.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(currentData.overallConversion, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <span>Baseline: {baseline}%</span>
              <span>Current: {currentData.overallConversion.toFixed(1)}%</span>
              <span>Target: {target}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time on Results Screen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Time on Results Screen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Average Time</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summary.avg_time_on_results_seconds > 0
                ? `${Math.round(summary.avg_time_on_results_seconds)}s`
                : 'N/A'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Mean engagement time</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Median Time</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summary.median_time_on_results_seconds > 0
                ? `${Math.round(summary.median_time_on_results_seconds)}s`
                : 'N/A'}
            </p>
            <p className="mt-1 text-xs text-gray-500">Typical user behavior</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sessions Measured</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summary.sessions_with_time_data || 0}
            </p>
            <p className="mt-1 text-xs text-gray-500">With complete timing data</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Ideal Range:</strong> 20-60 seconds indicates users are reading the content without bouncing.
          </p>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      {metricsData.daily && metricsData.daily.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Assessments</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Results</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTA</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Emails</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversion</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metricsData.daily.slice(0, 14).map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {day.assessments_completed || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {day.results_viewed || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {day.cta_clicked || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {day.emails_captured || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`font-medium ${
                        day.overall_conversion_rate_pct >= target
                          ? 'text-green-600'
                          : day.overall_conversion_rate_pct > baseline
                          ? 'text-blue-600'
                          : 'text-orange-600'
                      }`}>
                        {day.overall_conversion_rate_pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">
          <strong>Last Updated:</strong> {new Date(metricsData.metadata.generatedAt).toLocaleString()}
          {' • '}
          <strong>Refreshes:</strong> Every 60 seconds
          {' • '}
          <strong>API Endpoint:</strong> /api/metrics/value-first
        </p>
      </div>
    </div>
  );
}
