import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { verifyAdminAuth } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (supports session or password header)
    const { isAuthenticated, isAdmin, error } = await verifyAdminAuth(request)

    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseService = getServiceSupabase()

    // Load delivery logs with assessment data
    const { data: deliveryLogs, error: deliveryError } = await supabaseService
      .from('guide_deliveries')
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
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (commError) {
      console.error('Error fetching communication logs:', commError)
    }

    // Return with aggressive no-cache headers to prevent stale data
    return NextResponse.json(
      {
        deliveryLogs: deliveryLogs || [],
        optOuts: optOuts || [],
        communicationLogs: commLogs || []
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('Communications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      }
    )
  }
}