import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/server-admin'
import { getServiceSupabase } from '@/lib/supabase'
import CommunicationsClient from './CommunicationsClient'

/**
 * Admin Communications - Server Component
 *
 * Fetches delivery logs and opt-outs server-side with no caching.
 * Passes data to client component for rendering and interactivity.
 */
export default async function CommunicationsPage() {
  // Prevent caching - always fetch fresh data
  noStore()

  // Check authentication
  const isAuthenticated = await requireAdminAuth()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  // Fetch communications data server-side
  const data = await fetchCommunicationsData()

  return <CommunicationsClient {...data} />
}

/**
 * Fetch communications data from Supabase
 * Uses service role for full access
 */
async function fetchCommunicationsData() {
  const supabaseService = getServiceSupabase()

  try {
    // Load delivery logs with assessment data
    const { data: deliveryLogs } = await supabaseService
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

    // Load SMS opt-outs
    const { data: optOuts } = await supabaseService
      .from('sms_opt_outs')
      .select('*')
      .order('opted_out_at', { ascending: false })

    // Also get communication_logs for additional email tracking
    const { data: communicationLogs } = await supabaseService
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    return {
      deliveryLogs: deliveryLogs || [],
      optOuts: optOuts || [],
      communicationLogs: communicationLogs || []
    }
  } catch (error) {
    console.error('Error fetching communications data:', error)
    return {
      deliveryLogs: [],
      optOuts: [],
      communicationLogs: []
    }
  }
}
