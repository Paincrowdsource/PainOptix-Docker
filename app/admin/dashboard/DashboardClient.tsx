'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Users, Mail, MessageSquare, TrendingUp, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DropoffAnalytics from '@/components/admin/DropoffAnalytics'

interface DashboardData {
  totalAssessments: number
  freeGuidesDelivered: number
  deliveryStats: {
    emailSuccess: number
    emailFailed: number
    smsSuccess: number
    smsFailed: number
  }
  recentAssessments: any[]
  totalDeliveries: number
  pilotStats?: {
    source?: string
    totals?: {
      pilot_count: number
      pilot_revenue_cents: number
      standard_count: number
      standard_revenue_cents: number
    }
    by_tier?: Record<string, any>
  } | null
}

interface Props {
  data: DashboardData
}

/**
 * Dashboard Client Component
 *
 * Renders dashboard data provided by the Server Component parent.
 * No API calls - all data comes from props (server-side).
 */
export default function DashboardClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dropoffs'>('overview')
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setRefreshing(true)
    // Trigger a router refresh to re-fetch server-side data
    router.refresh()
    // Reset refreshing state after a short delay
    setTimeout(() => setRefreshing(false), 1000)
  }

  const deliverySuccessRate = data.totalDeliveries > 0
    ? ((data.deliveryStats.emailSuccess + data.deliveryStats.smsSuccess) / data.totalDeliveries * 100).toFixed(1)
    : '0'

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your PainOptix performance and metrics</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
                <div className="text-2xl font-bold">{data.totalAssessments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Free Guides Delivered</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.freeGuidesDelivered}</div>
                <p className="text-xs text-muted-foreground mt-1">Lead Gen Mode</p>
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
                <div className="text-2xl font-bold">{data.totalDeliveries}</div>
              </CardContent>
            </Card>

          </div>

          {/* Delivery Statistics */}
          <div className="grid gap-6 mb-8 md:grid-cols-1 lg:grid-cols-2">
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
                    <span className="text-sm text-green-600">{data.deliveryStats.emailSuccess}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Failed
                    </span>
                    <span className="text-sm text-red-600">{data.deliveryStats.emailFailed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS Success
                    </span>
                    <span className="text-sm text-green-600">{data.deliveryStats.smsSuccess}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS Failed
                    </span>
                    <span className="text-sm text-red-600">{data.deliveryStats.smsFailed}</span>
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
                {data.recentAssessments.map((assessment: any) => (
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
