'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, Activity, TrendingUp, Users, BarChart, CheckCircle } from 'lucide-react'

export default function AnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [businessMetrics, setBusinessMetrics] = useState({
    totalAssessments: 0,
    weeklyAssessments: 0,
  })

  const loadBusinessMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'x-admin-password': 'P@inOpt!x#Adm1n2025$ecure'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()

      setBusinessMetrics({
        totalAssessments: data.totalAssessments || 0,
        weeklyAssessments: data.weeklyAssessments || 0,
      })
    } catch (error) {
      console.error('Error loading business metrics:', error)
    }
  }, [])

  useEffect(() => {
    loadBusinessMetrics()
  }, [loadBusinessMetrics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadBusinessMetrics()
    setRefreshing(false)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Overview</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">External Analytics Platforms</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold">Google Analytics 4</h3>
            <div className="mb-2 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              <span>Active</span>
            </div>
            <p className="mb-4 text-sm text-gray-600">Measurement ID: G-VHKJYKBKJP</p>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:underline"
            >
              View in Google Analytics
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 font-semibold">Meta Pixel</h3>
            <div className="mb-2 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              <span>Active</span>
            </div>
            <p className="mb-4 text-sm text-gray-600">Pixel ID: 1623899711325019</p>
            <a
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:underline"
            >
              View in Events Manager
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Business Metrics</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {businessMetrics.totalAssessments.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">All time</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {businessMetrics.weeklyAssessments.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">Last 7 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="mb-4 font-semibold">Analytics Overview</h3>
        <p className="mb-4 text-gray-600">
          Detailed analytics are available in the external platforms linked above.
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>Page views and user behavior: Google Analytics</li>
          <li>Ad performance and conversions: Meta Events Manager</li>
          <li>Business metrics: See Dashboard for assessment and user stats</li>
          <li>Email delivery tracking: Communications page</li>
        </ul>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold">Quick Links</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <a href="/admin/dashboard" className="flex items-center rounded-lg border p-3 transition hover:bg-gray-50">
            <BarChart className="mr-3 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Dashboard</p>
              <p className="text-sm text-gray-500">View assessment stats and trends</p>
            </div>
          </a>
          <a href="/admin/communications" className="flex items-center rounded-lg border p-3 transition hover:bg-gray-50">
            <Activity className="mr-3 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Communications</p>
              <p className="text-sm text-gray-500">Track email and SMS delivery</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
