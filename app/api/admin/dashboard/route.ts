import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAuth } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (supports session or password header)
    const { isAuthenticated, isAdmin, error } = await verifyAdminAuth(request)

    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        }
      )
    }

    const supabaseService = getServiceSupabase()

    // Get total assessments
    const { count: totalAssessments, error: countError } = await supabaseService
      .from('assessments')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting assessments:', countError)
    }

    // Get revenue data
    const { data: revenueData, error: revenueError } = await supabaseService
      .from('assessments')
      .select('payment_tier, payment_completed')
      .eq('payment_completed', true)

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError)
    }

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
    const { data: communicationLogs, error: commError } = await supabaseService
      .from('communication_logs')
      .select('type, status, channel')

    if (commError) {
      console.error('Error fetching communication logs:', commError)
    }

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
    const { count: deliverySuccess, error: deliverySuccessError } = await supabaseService
      .from('guide_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'sent')

    const { count: deliveryFailed, error: deliveryFailedError } = await supabaseService
      .from('guide_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'failed')

    if (deliverySuccessError) {
      console.error('Error counting successful deliveries:', deliverySuccessError)
    }
    if (deliveryFailedError) {
      console.error('Error counting failed deliveries:', deliveryFailedError)
    }

    // Combine stats from both tables
    if (deliverySuccess) {
      deliveryStats.emailSuccess = Math.max(deliveryStats.emailSuccess, deliverySuccess)
    }
    if (deliveryFailed) {
      deliveryStats.emailFailed = Math.max(deliveryStats.emailFailed, deliveryFailed)
    }

    // Get recent assessments
    const { data: recentAssessments, error: recentError } = await supabaseService
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent assessments:', recentError)
    }

    // Calculate total revenue
    const totalRevenue = revenueByTier.free + revenueByTier.enhanced + revenueByTier.comprehensive

    // Total deliveries
    const totalDeliveries = deliveryStats.emailSuccess + deliveryStats.emailFailed + 
                          deliveryStats.smsSuccess + deliveryStats.smsFailed

    return NextResponse.json(
      {
        totalAssessments: totalAssessments || 0,
        totalRevenue,
        revenueByTier,
        deliveryStats,
        recentAssessments: recentAssessments || [],
        totalDeliveries
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Build-Stamp': process.env.NEXT_PUBLIC_BUILD_STAMP || 'n/a'
        }
      }
    )
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    )
  }
}