import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/server-admin'
import { getServiceSupabase } from '@/lib/supabase'
import CommunicationsClient from './CommunicationsClient'

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function CommunicationsPage() {
  noStore()

  const isAuthenticated = await requireAdminAuth()
  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  const data = await fetchCommunicationsData()

  return (
    <CommunicationsClient
      deliveryLogs={data.deliveryLogs}
      optOuts={data.optOuts}
      communicationLogs={data.communicationLogs}
    />
  )
}

async function fetchCommunicationsData() {
  const supabaseService = getServiceSupabase()

  try {
    // Load delivery logs
    const { data: rawDeliveryLogs, error: deliveryError } = await supabaseService
      .from('v_guide_deliveries_visible')
      .select('*')
      .order('delivered_at', { ascending: false, nullsFirst: false })

    if (deliveryError) {
      console.error('Error fetching delivery logs:', deliveryError)
    }

    // Enrich with assessment data
    const assessmentIds = Array.from(new Set(rawDeliveryLogs?.map(log => log.assessment_id).filter(Boolean) || []))
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

    const deliveryLogs = (rawDeliveryLogs || []).map(log => ({
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
    }

    // Load communication logs (actual SendGrid/Twilio send records)
    const { data: communicationLogs, error: commError } = await supabaseService
      .from('v_communication_logs_visible')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (commError) {
      console.error('Error fetching communication logs:', commError)
    }

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
