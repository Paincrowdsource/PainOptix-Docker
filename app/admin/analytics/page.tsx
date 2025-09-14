'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, Activity, TrendingUp, Users, Clock, BarChart, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [businessMetrics, setBusinessMetrics] = useState({
    totalAssessments: 0,
    weeklyAssessments: 0,
    totalPurchases: 0
  })

  useEffect(() => {
    loadBusinessMetrics()
  }, [])

  const loadBusinessMetrics = async () => {
    try {
      // Get total assessments
      const { count: totalAssessments } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })

      // Get this week's assessments
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { count: weeklyAssessments } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())

      // Get total purchases (assessments with tier != 'standard')
      const { count: totalPurchases } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .neq('tier', 'standard')

      setBusinessMetrics({
        totalAssessments: totalAssessments || 0,
        weeklyAssessments: weeklyAssessments || 0,
        totalPurchases: totalPurchases || 0
      })
    } catch (error) {
      console.error('Error loading business metrics:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadBusinessMetrics()
    setRefreshing(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Analytics Overview</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* External Analytics Status Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">External Analytics Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Analytics 4 Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Google Analytics 4</h3>
            <div className="flex items-center mb-2">
              <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
              <span>Active</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Measurement ID: G-VHKJYKBKJP</p>
            <a 
              href="https://analytics.google.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center"
            >
              View in Google Analytics
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>

          {/* Meta Pixel Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Meta Pixel</h3>
            <div className="flex items-center mb-2">
              <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
              <span>Active</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Pixel ID: 1623899711325019</p>
            <a 
              href="https://business.facebook.com/events_manager" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center"
            >
              View in Events Manager
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-semibold text-gray-900">{businessMetrics.totalAssessments.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-semibold text-gray-900">{businessMetrics.weeklyAssessments.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Tiers</p>
                <p className="text-2xl font-semibold text-gray-900">{businessMetrics.totalPurchases.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Enhanced + Monograph</p>
              </div>
              <BarChart className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Analytics Overview</h3>
        <p className="text-gray-600 mb-4">
          Detailed analytics are available in the external platforms linked above.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span className="text-gray-700">Page views and user behavior: Google Analytics</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span className="text-gray-700">Ad performance and conversions: Meta Events Manager</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span className="text-gray-700">Business metrics: See Dashboard for assessment and user stats</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span className="text-gray-700">Email delivery tracking: Communications page</span>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/dashboard"
            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Dashboard</p>
              <p className="text-sm text-gray-500">View assessment stats and trends</p>
            </div>
          </a>
          <a
            href="/admin/communications"
            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-5 w-5 text-gray-400 mr-3" />
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