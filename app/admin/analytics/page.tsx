'use client'

import { useState } from 'react'
import { RefreshCw, ExternalLink, Activity, TrendingUp, Users, Clock } from 'lucide-react'

export default function AnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000)
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

      {/* Tracking Status Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Tracking Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meta Pixel Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Meta Pixel</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Active
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Pixel ID:</span> 1623899711325019
                  </div>
                </div>
                <a
                  href="https://business.facebook.com/events_manager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View in Events Manager
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </div>
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          {/* Google Analytics Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Google Analytics</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Active
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Measurement ID:</span> G-VHKJYKBKJP
                  </div>
                </div>
                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View in GA4
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Visitors</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
                <p className="text-xs text-gray-500 mt-1">(loading)</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
                <p className="text-xs text-gray-500 mt-1">(loading)</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Now</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
                <p className="text-xs text-gray-500 mt-1">(loading)</p>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 text-center italic">Real-time data coming soon</p>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Info
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>Analytics data will appear here once integrated</p>
                  <p className="text-sm text-gray-400 mt-1">Check the external dashboards for current data</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}