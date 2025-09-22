import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Method 1: Try Supabase Auth first
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    let isAuthenticated = false
    let isAdmin = false
    
    if (session?.user) {
      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', session.user.id)
        .single()
      
      if (profile?.user_role === 'admin') {
        isAuthenticated = true
        isAdmin = true
      }
    }
    
    // Method 2: Fallback to simple password check if Supabase auth fails
    if (!isAuthenticated) {
      // Check for admin password in header as fallback
      const authHeader = request.headers.get('x-admin-password')
      const adminPassword = process.env.ADMIN_PASSWORD
      
      if (authHeader && adminPassword && authHeader === adminPassword) {
        isAuthenticated = true
        isAdmin = true
      }
    }
    
    // If still not authenticated, return 401
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    return NextResponse.json({
      totalAssessments: totalAssessments || 0,
      totalRevenue,
      revenueByTier,
      deliveryStats,
      recentAssessments: recentAssessments || [],
      totalDeliveries
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}