'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { DollarSign, Users, Mail, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'
import DropoffAnalytics from '@/components/admin/DropoffAnalytics'

interface Stats {
  totalAssessments: number
  revenueByTier: {
    free: number
    enhanced: number
    comprehensive: number
  }
  deliveryStats: {
    emailSuccess: number
    emailFailed: number
    smsSuccess: number
    smsFailed: number
  }
  recentAssessments: any[]
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'dropoffs'>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Use API endpoint to fetch data with service role permissions
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // Add admin password as fallback auth
          'x-admin-password': 'P@inOpt!x#Adm1n2025$ecure'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Dashboard API Error:', error)
        throw new Error(error.error || 'Failed to fetch dashboard data')
      }

      const data = await response.json()
      
      setStats({
        totalAssessments: data.totalAssessments || 0,
        revenueByTier: data.revenueByTier || {
          free: 0,
          enhanced: 0,
          comprehensive: 0
        },
        deliveryStats: data.deliveryStats || {
          emailSuccess: 0,
          emailFailed: 0,
          smsSuccess: 0,
          smsFailed: 0
        },
        recentAssessments: data.recentAssessments || []
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Error loading dashboard: {error}
        </div>
      </div>
    )
  }

  const totalRevenue = stats ? 
    stats.revenueByTier.free + stats.revenueByTier.enhanced + stats.revenueByTier.comprehensive 
    : 0

  const totalDeliveries = stats ?
    stats.deliveryStats.emailSuccess + stats.deliveryStats.emailFailed + 
    stats.deliveryStats.smsSuccess + stats.deliveryStats.smsFailed
    : 0

  const deliverySuccessRate = totalDeliveries > 0 ?
    ((stats!.deliveryStats.emailSuccess + stats!.deliveryStats.smsSuccess) / totalDeliveries * 100).toFixed(1)
    : '0'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your PainOptix performance and metrics</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('dropoffs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dropoffs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Drop-off Analytics
          </button>
        </nav>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Key Metrics */}
          <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAssessments || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliverySuccessRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeliveries}</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid gap-6 mb-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Free Guide</span>
                    <span className="text-sm text-gray-600">${stats?.revenueByTier.free || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enhanced Guide ($47)</span>
                    <span className="text-sm text-gray-600">${stats?.revenueByTier.enhanced || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Comprehensive Guide ($97)</span>
                    <span className="text-sm text-gray-600">${stats?.revenueByTier.comprehensive || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Success
                    </span>
                    <span className="text-sm text-green-600">{stats?.deliveryStats.emailSuccess || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Failed
                    </span>
                    <span className="text-sm text-red-600">{stats?.deliveryStats.emailFailed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS Success
                    </span>
                    <span className="text-sm text-green-600">{stats?.deliveryStats.smsSuccess || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS Failed
                    </span>
                    <span className="text-sm text-red-600">{stats?.deliveryStats.smsFailed || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentAssessments.map((assessment: any) => (
                  <div key={assessment.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{assessment.email || assessment.phone || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">
                        {assessment.diagnosis || 'No diagnosis'} • {assessment.payment_tier || 'free'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(assessment.created_at), { addSuffix: true })}
                      </p>
                      {assessment.payment_completed && (
                        <p className="text-sm text-green-600">Paid</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <DropoffAnalytics />
      )}
    </div>
  )
}