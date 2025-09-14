import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('x-admin-token')
    if (authHeader !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceSupabase()

    // Load delivery logs with assessment data
    const { data: deliveryLogs, error: deliveryError } = await supabase
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
    const { data: optOuts, error: optOutError } = await supabase
      .from('sms_opt_outs')
      .select('*')
      .order('opted_out_at', { ascending: false })

    if (optOutError) {
      console.error('Error fetching opt-outs:', optOutError)
      return NextResponse.json({ error: 'Failed to fetch opt-outs' }, { status: 500 })
    }

    // Also get communication_logs for additional email tracking
    const { data: commLogs, error: commError } = await supabase
      .from('communication_logs')
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