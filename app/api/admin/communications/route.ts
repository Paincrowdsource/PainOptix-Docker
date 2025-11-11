import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-ssr'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Method 1: Try Supabase Auth first
    const { supabase } = await createSupabaseRouteHandlerClient(request)

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

    // Load delivery logs (step 1: get guide_deliveries)
    const { data: deliveryLogs, error: deliveryError } = await supabaseService
      .from('v_guide_deliveries_visible')
      .select('*')
      .order('delivered_at', { ascending: false, nullsFirst: false })

    if (deliveryError) {
      console.error('Error fetching delivery logs:', deliveryError)
      return NextResponse.json({ error: 'Failed to fetch delivery logs' }, { status: 500 })
    }

    // Load assessment data separately (step 2: manual join)
    const assessmentIds = Array.from(new Set(deliveryLogs?.map(log => log.assessment_id).filter(Boolean) || []))
    let assessmentsMap: Record<string, any> = {}

    if (assessmentIds.length > 0) {
      const { data: assessmentsData } = await supabaseService
        .from('v_assessments_visible')
        .select('id, email, phone_number, guide_type')
        .in('id', assessmentIds)

      assessmentsMap = (assessmentsData || []).reduce((acc, assessment) => {
        acc[assessment.id] = assessment
        return acc
      }, {} as Record<string, any>)
    }

    // Enrich delivery logs with assessment data
    const enrichedDeliveryLogs = (deliveryLogs || []).map(log => ({
      ...log,
      assessment: log.assessment_id ? (assessmentsMap[log.assessment_id] || null) : null
    }))

    // Load SMS opt-outs
    const { data: optOuts, error: optOutError } = await supabaseService
      .from('sms_opt_outs')
      .select('*')
      .order('opted_out_at', { ascending: false })

    if (optOutError) {
      console.error('Error fetching opt-outs:', optOutError)
      return NextResponse.json({ error: 'Failed to fetch opt-outs' }, { status: 500 })
    }

    // Also get communication_logs for additional email tracking
    const { data: commLogs, error: commError } = await supabaseService
      .from('v_communication_logs_visible')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (commError) {
      console.error('Error fetching communication logs:', commError)
    }

    return NextResponse.json(
      {
        deliveryLogs: enrichedDeliveryLogs || [],
        optOuts: optOuts || [],
        communicationLogs: commLogs || [],
        meta: {
          routeVersion: 'communications-v2',
          ts: new Date().toISOString()
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-PO-Route-Version': 'communications-v2'
        }
      }
    )
  } catch (error) {
    console.error('Communications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}