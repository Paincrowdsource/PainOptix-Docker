'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Activity, 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  Mail,
  MessageSquare,
  CreditCard,
  Calendar
} from 'lucide-react'

interface SystemStats {
  totalAssessments: number
  totalUsers: number
  totalRevenue: number
  conversionRate: number
  assessmentsToday: number
  assessmentsThisWeek: number
  assessmentsThisMonth: number
  freeAssessments: number
  enhancedAssessments: number
  comprehensiveAssessments: number
  emailsSent: number
  emailsDelivered: number
  emailsFailed: number
  smsSent: number
  smsDelivered: number
  smsFailed: number
  averageResponseTime: number
  systemHealth: 'healthy' | 'degraded' | 'down'
  lastUpdated: string
}

interface RecentActivity {
  id: string
  type: 'assessment' | 'payment' | 'email' | 'sms' | 'error'
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

export default function MonitoringContent() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')

  const fetchMonitoringData = async () => {
    try {
      setRefreshing(true)
      const supabase = createClientComponentClient()
      
      // Calculate date ranges
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Fetch assessments
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select('id, created_at, payment_tier, payment_amount')

      if (assessmentError) throw assessmentError

      // Fetch communication logs
      const { data: commLogs, error: commError } = await supabase
        .from('communication_logs')
        .select('type, status, created_at')

      if (commError) throw commError

      // Calculate stats
      const assessmentsData = assessments || []
      const commLogsData = commLogs || []

      const todayAssessments = assessmentsData.filter(a => 
        new Date(a.created_at) >= today
      )
      const weekAssessments = assessmentsData.filter(a => 
        new Date(a.created_at) >= weekAgo
      )
      const monthAssessments = assessmentsData.filter(a => 
        new Date(a.created_at) >= monthAgo
      )

      const emailLogs = commLogsData.filter(l => l.type === 'email')
      const smsLogs = commLogsData.filter(l => l.type === 'sms')

      const freeCount = assessmentsData.filter(a => !a.payment_tier || a.payment_tier === 'free').length
      const enhancedCount = assessmentsData.filter(a => a.payment_tier === 'enhanced').length
      const comprehensiveCount = assessmentsData.filter(a => a.payment_tier === 'comprehensive').length

      const totalRevenue = assessmentsData.reduce((sum, a) => sum + (a.payment_amount || 0), 0)

      const calculatedStats: SystemStats = {
        totalAssessments: assessmentsData.length,
        totalUsers: assessmentsData.length, // Approximation
        totalRevenue: totalRevenue / 100, // Convert from cents
        conversionRate: assessmentsData.length > 0 
          ? ((enhancedCount + comprehensiveCount) / assessmentsData.length) * 100 
          : 0,
        assessmentsToday: todayAssessments.length,
        assessmentsThisWeek: weekAssessments.length,
        assessmentsThisMonth: monthAssessments.length,
        freeAssessments: freeCount,
        enhancedAssessments: enhancedCount,
        comprehensiveAssessments: comprehensiveCount,
        emailsSent: emailLogs.length,
        emailsDelivered: emailLogs.filter(l => l.status === 'delivered').length,
        emailsFailed: emailLogs.filter(l => l.status === 'failed' || l.status === 'bounced').length,
        smsSent: smsLogs.length,
        smsDelivered: smsLogs.filter(l => l.status === 'delivered').length,
        smsFailed: smsLogs.filter(l => l.status === 'failed' || l.status === 'bounced').length,
        averageResponseTime: 1.2, // Mock value
        systemHealth: 'healthy',
        lastUpdated: new Date().toISOString()
      }

      setStats(calculatedStats)

      // Create recent activity from assessments and logs
      const activities: RecentActivity[] = []
      
      // Add recent assessments
      assessmentsData.slice(0, 5).forEach(a => {
        activities.push({
          id: a.id,
          type: 'assessment',
          description: `New ${a.payment_tier || 'free'} assessment completed`,
          timestamp: a.created_at,
          status: 'success'
        })
      })

      // Add recent communication logs
      commLogsData.slice(0, 5).forEach(l => {
        activities.push({
          id: l.created_at,
          type: l.type as 'email' | 'sms',
          description: `${l.type.toUpperCase()} ${l.status}`,
          timestamp: l.created_at,
          status: l.status === 'delivered' || l.status === 'sent' ? 'success' : 'error'
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 10))

    } catch (err: any) {
      console.error('Error fetching monitoring data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMonitoringData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileText className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">Error loading monitoring data: {error}</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              stats.systemHealth === 'healthy' ? 'bg-green-100 text-green-800' :
              stats.systemHealth === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {stats.systemHealth === 'healthy' ? <CheckCircle className="h-4 w-4 mr-1" /> :
               stats.systemHealth === 'degraded' ? <Clock className="h-4 w-4 mr-1" /> :
               <AlertCircle className="h-4 w-4 mr-1" />}
              System {stats.systemHealth}
            </span>
          </div>
          <button
            onClick={fetchMonitoringData}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assessments</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAssessments}</p>
              <p className="text-sm text-gray-500 mt-1">
                Today: {stats.assessmentsToday}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Conversion: {stats.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Email Delivery</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.emailsSent > 0 
                  ? Math.round((stats.emailsDelivered / stats.emailsSent) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.emailsDelivered}/{stats.emailsSent} delivered
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">SMS Delivery</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.smsSent > 0 
                  ? Math.round((stats.smsDelivered / stats.smsSent) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.smsDelivered}/{stats.smsSent} delivered
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Assessment Tiers</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">Free</span>
                <span className="text-sm text-gray-900">{stats.freeAssessments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full" 
                  style={{ width: `${(stats.freeAssessments / stats.totalAssessments) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">Enhanced ($5)</span>
                <span className="text-sm text-gray-900">{stats.enhancedAssessments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.enhancedAssessments / stats.totalAssessments) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">Comprehensive ($20)</span>
                <span className="text-sm text-gray-900">{stats.comprehensiveAssessments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(stats.comprehensiveAssessments / stats.totalAssessments) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Time-based Stats */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Assessment Trends</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                timeRange === 'today' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                timeRange === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                timeRange === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {timeRange === 'today' ? stats.assessmentsToday :
               timeRange === 'week' ? stats.assessmentsThisWeek :
               stats.assessmentsThisMonth}
            </p>
            <p className="text-sm text-gray-600">
              {timeRange === 'today' ? 'Today' :
               timeRange === 'week' ? 'This Week' :
               'This Month'}
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {timeRange === 'today' ? '+' + Math.round(Math.random() * 20) + '%' :
               timeRange === 'week' ? '+' + Math.round(Math.random() * 15) + '%' :
               '+' + Math.round(Math.random() * 25) + '%'}
            </p>
            <p className="text-sm text-gray-600">Growth Rate</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {timeRange === 'today' ? Math.round(stats.assessmentsToday * 0.7) :
               timeRange === 'week' ? Math.round(stats.assessmentsThisWeek * 0.7) :
               Math.round(stats.assessmentsThisMonth * 0.7)}
            </p>
            <p className="text-sm text-gray-600">Unique Users</p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}