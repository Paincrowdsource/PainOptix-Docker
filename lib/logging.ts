import { supabaseAdmin } from './supabase-admin'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type CommunicationType = 'email' | 'sms' | 'pdf' | 'notification'

// Log a communication event
export async function logCommunication({
  type,
  recipient,
  subject,
  message,
  status = 'pending',
  assessmentId,
  metadata
}: {
  type: CommunicationType
  recipient: string
  subject?: string
  message?: string
  status?: string
  assessmentId?: string
  metadata?: any
}) {
  try {
    const { data, error } = await supabaseAdmin()
      .from('communication_logs')
      .insert({
        type,
        recipient,
        subject,
        message,
        status,
        assessment_id: assessmentId,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to log communication:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error logging communication:', err)
    return null
  }
}

// Log a system event
export async function logSystemEvent({
  level,
  message,
  metadata
}: {
  level: LogLevel
  message: string
  metadata?: any
}) {
  try {
    const { data, error } = await supabaseAdmin()
      .from('system_logs')
      .insert({
        level,
        message,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to log system event:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error logging system event:', err)
    return null
  }
}

// Log PDF generation
export async function logPDFGeneration({
  assessmentId,
  tier,
  status,
  fileSize,
  pageCount,
  errorMessage,
  requestedBy,
  ipAddress
}: {
  assessmentId: string
  tier: 'free' | 'enhanced' | 'comprehensive'
  status: 'pending' | 'generating' | 'success' | 'failed'
  fileSize?: number
  pageCount?: number
  errorMessage?: string
  requestedBy?: string
  ipAddress?: string
}) {
  try {
    const { data, error } = await supabaseAdmin()
      .from('pdf_generation_logs')
      .insert({
        assessment_id: assessmentId,
        tier,
        status,
        file_size_bytes: fileSize,
        page_count: pageCount,
        error_message: errorMessage,
        requested_by: requestedBy,
        ip_address: ipAddress,
        started_at: status === 'generating' ? new Date().toISOString() : undefined,
        completed_at: status === 'success' || status === 'failed' ? new Date().toISOString() : undefined
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to log PDF generation:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error logging PDF generation:', err)
    return null
  }
}

// Log payment activity
export async function logPayment({
  assessmentId,
  stripeSessionId,
  stripePaymentIntent,
  amountCents,
  tier,
  status,
  customerEmail,
  customerId,
  metadata
}: {
  assessmentId?: string
  stripeSessionId?: string
  stripePaymentIntent?: string
  amountCents: number
  tier: 'enhanced' | 'comprehensive'
  status: string
  customerEmail: string
  customerId?: string
  metadata?: any
}) {
  try {
    const { data, error } = await supabaseAdmin()
      .from('payment_logs')
      .insert({
        assessment_id: assessmentId,
        stripe_session_id: stripeSessionId,
        stripe_payment_intent: stripePaymentIntent,
        amount_cents: amountCents,
        tier,
        status,
        customer_email: customerEmail,
        customer_id: customerId,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to log payment:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error logging payment:', err)
    return null
  }
}

// Log admin action
export async function logAdminAction({
  adminId,
  action,
  resourceType,
  resourceId,
  ipAddress,
  userAgent,
  metadata
}: {
  adminId: string
  action: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
}) {
  try {
    const { data, error } = await supabaseAdmin()
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to log admin action:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error logging admin action:', err)
    return null
  }
}