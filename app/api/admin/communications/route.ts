import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-ssr'

export const dynamic = 'force-dynamic';

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

    // Load delivery logs with assessment data
    const { data: deliveryLogs, error: deliveryError } = await supabaseService
      .from('v_guide_deliveries_visible')
      .select(`
        *,
        assessment:assessments (
          email,
          phone_number,
          guide_type
        )
      `)
      .order('delivered_at', { ascending: false, nullsFirst: false })

    if (deliveryError) {
      console.error('Error fetching delivery logs:', deliveryError)
      return NextResponse.json({ error: 'Failed to fetch delivery logs' }, { status: 500 })
    }

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

    return NextResponse.json({
      deliveryLogs: deliveryLogs || [],
      optOuts: optOuts || [],
      communicationLogs: commLogs || []
    })
  } catch (error) {
    console.error('Communications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}