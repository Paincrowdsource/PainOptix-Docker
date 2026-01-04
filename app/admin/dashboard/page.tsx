import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/server-admin'
import { getServiceSupabase } from '@/lib/supabase'
import DashboardClient from './DashboardClient'

// Disable all caching for admin dashboard
export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * Calculate date cutoff based on time period selection
 */
function getDateCutoff(period: string): string | null {
  const now = new Date()
  switch (period) {
    case '30d': {
      const date = new Date(now)
      date.setDate(date.getDate() - 30)
      return date.toISOString()
    }
    case '90d': {
      const date = new Date(now)
      date.setDate(date.getDate() - 90)
      return date.toISOString()
    }
    case 'ytd':
      return `${now.getFullYear()}-01-01T00:00:00Z`
    case 'all':
      return null
    default: {
      const date = new Date(now)
      date.setDate(date.getDate() - 30)
      return date.toISOString()
    }
  }
}

/**
 * Admin Dashboard - Server Component
 *
 * Fetches all data server-side with no caching.
 * Passes data to client component for rendering.
 */
export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ timePeriod?: string }>
}) {
  // Prevent caching - always fetch fresh data
  noStore()

  // Check authentication
  const isAuthenticated = await requireAdminAuth()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  // Get time period from search params (default to 30 days)
  const params = await searchParams
  const timePeriod = params.timePeriod || '30d'
  const dateCutoff = getDateCutoff(timePeriod)

  // Fetch dashboard data server-side with date filter
  const dashboardData = await fetchDashboardData(dateCutoff)

  return <DashboardClient data={dashboardData} timePeriod={timePeriod} />
}

/**
 * Fetch dashboard data from Supabase
 * Uses service role for full access to all tables
 * @param dateCutoff - ISO date string to filter data, or null for all time
 */
async function fetchDashboardData(dateCutoff: string | null) {
  const supabaseService = getServiceSupabase()

  try {
    // Get total assessments (view automatically excludes quarantined)
    let assessmentsQuery = supabaseService
      .from('v_assessments_visible')
      .select('*', { count: 'exact', head: true })
    if (dateCutoff) {
      assessmentsQuery = assessmentsQuery.gte('created_at', dateCutoff)
    }
    const { count: totalAssessments } = await assessmentsQuery

    // Get free guides delivered count (Phase 1 Pivot: Lead Gen focus)
    // Note: guide_deliveries doesn't have created_at, so we filter via assessment join
    let guidesQuery = supabaseService
      .from('v_guide_deliveries_visible')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'sent')
    if (dateCutoff) {
      guidesQuery = guidesQuery.gte('delivered_at', dateCutoff)
    }
    const { count: freeGuidesDelivered } = await guidesQuery

    // Get delivery stats from communication_logs with date filter
    let commLogsQuery = supabaseService
      .from('v_communication_logs_visible')
      .select('type, status, channel')
    if (dateCutoff) {
      commLogsQuery = commLogsQuery.gte('created_at', dateCutoff)
    }
    const { data: communicationLogs } = await commLogsQuery

    const deliveryStats = {
      emailSuccess: 0,
      emailFailed: 0,
      smsSuccess: 0,
      smsFailed: 0
    }

    communicationLogs?.forEach(log => {
      if (log.channel === 'email' || log.type === 'email') {
        if (log.status === 'sent' || log.status === 'delivered') {
          deliveryStats.emailSuccess++
        } else if (log.status === 'failed') {
          deliveryStats.emailFailed++
        }
      } else if (log.channel === 'sms' || log.type === 'sms') {
        if (log.status === 'sent' || log.status === 'delivered') {
          deliveryStats.smsSuccess++
        } else if (log.status === 'failed') {
          deliveryStats.smsFailed++
        }
      }
    })

    // Also check guide_deliveries for additional delivery stats (with date filter)
    let deliverySuccessQuery = supabaseService
      .from('v_guide_deliveries_visible')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'sent')
    if (dateCutoff) {
      deliverySuccessQuery = deliverySuccessQuery.gte('delivered_at', dateCutoff)
    }
    const { count: deliverySuccess } = await deliverySuccessQuery

    let deliveryFailedQuery = supabaseService
      .from('v_guide_deliveries_visible')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'failed')
    if (dateCutoff) {
      deliveryFailedQuery = deliveryFailedQuery.gte('delivered_at', dateCutoff)
    }
    const { count: deliveryFailed } = await deliveryFailedQuery

    // Combine stats from both tables
    if (deliverySuccess) {
      deliveryStats.emailSuccess = Math.max(deliveryStats.emailSuccess, deliverySuccess)
    }
    if (deliveryFailed) {
      deliveryStats.emailFailed = Math.max(deliveryStats.emailFailed, deliveryFailed)
    }

    // Get recent assessments (view automatically excludes quarantined)
    // Recent assessments always show the latest 10 regardless of filter
    const { data: recentAssessments } = await supabaseService
      .from('v_assessments_visible')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const totalDeliveries = deliveryStats.emailSuccess + deliveryStats.emailFailed +
                          deliveryStats.smsSuccess + deliveryStats.smsFailed

    // Fetch pilot stats (24h window)
    const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    let pilotStats = null
    try {
      const pilotRes = await fetch(`${BASE}/api/admin/pilot-stats`, {
        cache: 'no-store'
      })
      if (pilotRes.ok) {
        pilotStats = await pilotRes.json()
      }
    } catch (e) {
      console.error('Error fetching pilot stats:', e)
    }

    return {
      totalAssessments: totalAssessments || 0,
      freeGuidesDelivered: freeGuidesDelivered || 0,
      deliveryStats,
      recentAssessments: recentAssessments || [],
      totalDeliveries,
      pilotStats
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return empty data on error
    return {
      totalAssessments: 0,
      freeGuidesDelivered: 0,
      deliveryStats: { emailSuccess: 0, emailFailed: 0, smsSuccess: 0, smsFailed: 0 },
      recentAssessments: [],
      totalDeliveries: 0,
      pilotStats: null
    }
  }
}
