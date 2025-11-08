import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/server-admin'
import { getServiceSupabase } from '@/lib/supabase'
import DashboardClient from './DashboardClient'

// Disable all caching for admin dashboard
export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * Admin Dashboard - Server Component
 *
 * Fetches all data server-side with no caching.
 * Passes data to client component for rendering.
 */
export default async function AdminDashboard() {
  // Prevent caching - always fetch fresh data
  noStore()

  // Check authentication
  const isAuthenticated = await requireAdminAuth()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  // Fetch dashboard data server-side
  const dashboardData = await fetchDashboardData()

  return <DashboardClient data={dashboardData} />
}

/**
 * Fetch dashboard data from Supabase
 * Uses service role for full access to all tables
 */
async function fetchDashboardData() {
  const supabaseService = getServiceSupabase()

  try {
    // Get total assessments (view automatically excludes quarantined)
    const { count: totalAssessments } = await supabaseService
      .from('v_assessments_visible')
      .select('*', { count: 'exact', head: true })

    // Get revenue data (view automatically excludes quarantined)
    const { data: revenueData } = await supabaseService
      .from('v_assessments_visible')
      .select('payment_tier, payment_completed')
      .eq('payment_completed', true)

    const revenueByTier = {
      free: 0,
      enhanced: 0,
      comprehensive: 0
    }

    const tierPrices = {
      free: 0,
      enhanced: 47,
      comprehensive: 97
    }

    revenueData?.forEach(assessment => {
      const tier = assessment.payment_tier || 'free'
      if (tier in revenueByTier) {
        revenueByTier[tier as keyof typeof revenueByTier] += tierPrices[tier as keyof typeof tierPrices]
      }
    })

    // Get delivery stats from communication_logs
    const { data: communicationLogs } = await supabaseService
      .from('v_communication_logs_visible')
      .select('type, status, channel')

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

    // Also check guide_deliveries for additional delivery stats
    const { count: deliverySuccess } = await supabaseService
      .from('v_guide_deliveries_visible')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'sent')

    const { count: deliveryFailed } = await supabaseService
      .from('v_guide_deliveries_visible')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'failed')

    // Combine stats from both tables
    if (deliverySuccess) {
      deliveryStats.emailSuccess = Math.max(deliveryStats.emailSuccess, deliverySuccess)
    }
    if (deliveryFailed) {
      deliveryStats.emailFailed = Math.max(deliveryStats.emailFailed, deliveryFailed)
    }

    // Get recent assessments (view automatically excludes quarantined)
    const { data: recentAssessments } = await supabaseService
      .from('v_assessments_visible')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const totalRevenue = revenueByTier.free + revenueByTier.enhanced + revenueByTier.comprehensive
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
      totalRevenue,
      revenueByTier,
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
      totalRevenue: 0,
      revenueByTier: { free: 0, enhanced: 0, comprehensive: 0 },
      deliveryStats: { emailSuccess: 0, emailFailed: 0, smsSuccess: 0, smsFailed: 0 },
      recentAssessments: [],
      totalDeliveries: 0,
      pilotStats: null
    }
  }
}
