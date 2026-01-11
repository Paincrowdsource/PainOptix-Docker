import { getServiceSupabase } from './supabase'
import { sendEmail, sendSMS, SendSMSResult } from './communications'
import { getEducationalGuideEmailTemplate, getSMSTemplate } from './email-templates/educational-guide'
import { getFreeTierWelcomeTemplate } from './email/templates/free-tier-welcome'
import { getEnhancedConfirmationTemplate } from './email/templates/enhanced-confirmation'
import { getMonographConfirmationTemplate } from './email/templates/monograph-confirmation'
import { resolveTierAndFlags } from './email/resolve-tier'
import { features } from './config'
import { logCommunication } from './comm/communication-logs'
import { logEvent } from './logging'

// Helper function to format assessment data for email templates
function formatAssessmentResults(assessment: any) {
  // Map guide_type to human-readable diagnosis
  const diagnosisMap: Record<string, string> = {
    'sciatica': 'Sciatica',
    'upper_lumbar_radiculopathy': 'Upper Lumbar Radiculopathy',
    'facet_arthropathy': 'Facet Arthropathy',
    'si_joint_dysfunction': 'SI Joint Dysfunction',
    'central_disc_bulge': 'Central Disc Bulge',
    'muscular_nslbp': 'Muscular Low Back Pain',
    'degenerated_disc': 'Degenerated Disc',
    'spondylolisthesis': 'Spondylolisthesis'
  }

  return {
    assessmentId: assessment.id,
    diagnosis: diagnosisMap[assessment.guide_type] || assessment.guide_type || 'Back Pain',
    severity: 'See assessment details',
    duration: 'See assessment details',
    guide_type: assessment.guide_type
  }
}

interface DeliveryOptions {
  forceSms?: boolean  // Bug 2 Fix: Force SMS delivery even if email was already sent
}

export async function deliverEducationalGuide(assessmentId: string, options: DeliveryOptions = {}) {
  const supabase = getServiceSupabase()
  const { forceSms = false } = options

  try {
    // Get assessment details
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (error || !assessment) {
      throw new Error('Assessment not found')
    }

    // Prepare delivery based on contact method
    let deliverySuccess = false
    let errorMessage: string | null = null
    let deliveryAttempts = 0
    const maxRetries = 3

    // Determine delivery method: respect user's explicit preference
    const wantsSMS = assessment.sms_opt_in === true && assessment.phone_number
    const prefersSMS = assessment.delivery_method === 'sms'
    const wantsBoth = assessment.delivery_method === 'both'

    console.log('[Guide Delivery] Starting delivery for assessment:', assessmentId)
    console.log('[Guide Delivery] User preferences:', {
      delivery_method: assessment.delivery_method,
      sms_opt_in: assessment.sms_opt_in,
      has_phone: !!assessment.phone_number,
      has_email: !!assessment.email,
      wantsSMS,
      prefersSMS,
      wantsBoth,
      forceSms
    })

    // SMS DELIVERY PATH: If user opted in for SMS and has phone
    // Bug 2 Fix: Also send if forceSms is true (for recovery/re-delivery scenarios)
    const shouldAttemptSms = (wantsSMS && (prefersSMS || wantsBoth) && features.smsEnabled) ||
                             (forceSms && assessment.phone_number && features.smsEnabled)

    if (shouldAttemptSms) {
      console.log('[Guide Delivery] Attempting SMS delivery to:', assessment.phone_number)

      const smsMessage = getSMSTemplate({
        guideType: assessment.guide_type,
        assessmentId: assessment.id,
      })

      const smsResult: SendSMSResult = await sendSMS({
        to: assessment.phone_number,
        message: smsMessage
      })

      console.log('[Guide Delivery] SMS result:', smsResult)

      if (smsResult.success) {
        deliverySuccess = true

        // Log successful SMS with SID for tracking
        // Wrapped in try/catch to surface any silent failures
        try {
          await logCommunication({
            assessmentId: assessment.id,
            templateKey: 'guide_sms_delivery',
            status: 'sent',
            channel: 'sms',
            providerId: smsResult.sid, // Store Twilio SID for webhook correlation
            recipient: assessment.phone_number,
            message: smsMessage.substring(0, 500)
          })
          console.log('[Guide Delivery] SMS logged to communication_logs:', assessment.id)
        } catch (logError) {
          console.error('[Guide Delivery] FAILED to log SMS to communication_logs:', {
            error: logError instanceof Error ? logError.message : logError,
            assessmentId: assessment.id,
            sid: smsResult.sid
          })
        }

        await logEvent('sms_sent_initial_assessment', {
          assessmentId: assessment.id,
          sid: smsResult.sid
        })
      } else {
        // Log failed SMS attempt with error details
        await logCommunication({
          assessmentId: assessment.id,
          templateKey: 'guide_sms_delivery',
          status: 'failed',
          channel: 'sms',
          recipient: assessment.phone_number,
          message: smsMessage.substring(0, 500),
          errorMessage: smsResult.error || 'SMS delivery failed'
        })

        console.log('[Guide Delivery] SMS failed, error:', smsResult.error)

        // If user only wanted SMS (not both), mark as failed
        if (prefersSMS && !wantsBoth && !assessment.email) {
          errorMessage = smsResult.error || 'SMS delivery failed and no email fallback'
        }
      }

      // If SMS failed but user also has email, try email as fallback
      if (!deliverySuccess && assessment.email && (wantsBoth || !prefersSMS)) {
        console.log('[Guide Delivery] SMS failed, falling back to email')
      }
    }

    // EMAIL DELIVERY PATH: Send email if not already successful via SMS
    // OR if user wants both, OR if user prefers email
    if (!deliverySuccess && assessment.email) {
      // Use the actual name from assessment, or extract from email as fallback
      let firstName = assessment.name;
      if (!firstName && assessment.email) {
        firstName = assessment.email.split('@')[0].split('.')[0] 
          .charAt(0).toUpperCase() + assessment.email.split('@')[0].split('.')[0].slice(1);
      }
      
      // Use new segmented templates based on tier
      const { tier, redFlag } = await resolveTierAndFlags(supabase, assessmentId)
      
      // Format assessment data for templates
      const assessmentResults = formatAssessmentResults(assessment)
      
      let emailTemplate: { subject: string; html: string; text: string }
      
      if (tier === 'monograph') {
        const html = getMonographConfirmationTemplate({ 
          assessmentResults,
          userTier: tier 
        })
        emailTemplate = {
          subject: 'Your Complete Educational Monograph is Ready',
          html,
          text: 'Your Complete Educational Monograph is Ready. Please view this email in HTML format.'
        }
      } else if (tier === 'enhanced') {
        const html = getEnhancedConfirmationTemplate({ 
          assessmentResults,
          userTier: tier 
        })
        emailTemplate = {
          subject: 'Your Enhanced Educational Report is Ready',
          html,
          text: 'Your Enhanced Educational Report is Ready. Please view this email in HTML format.'
        }
      } else {
        const html = getFreeTierWelcomeTemplate({ 
          assessmentResults,
          userTier: tier 
        })
        emailTemplate = {
          subject: 'Your PainOptix Educational Assessment & Free Guide',
          html,
          text: 'Your PainOptix Educational Assessment & Free Guide is Ready. Please view this email in HTML format.'
        }
      }
      
      // Validate email address before sending
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(assessment.email)) {
        errorMessage = `Invalid email address: ${assessment.email}`
        console.error(errorMessage)
      } else {
        // Try sending with retries
        let messageId: string | undefined
        while (deliveryAttempts < maxRetries && !deliverySuccess) {
          deliveryAttempts++

          try {
            const result = await sendEmail({
              to: assessment.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text
            })

            deliverySuccess = result.success
            if (result.messageId) {
              messageId = result.messageId
            }

            if (!deliverySuccess && deliveryAttempts < maxRetries) {
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * deliveryAttempts))
            }
          } catch (error: any) {
            errorMessage = error.message || 'Email delivery failed'
            console.error(`Email attempt ${deliveryAttempts} failed:`, errorMessage)
          }
        }

        // Log the communication if successful
        if (deliverySuccess) {
          await logCommunication({
            assessmentId: assessment.id,
            templateKey: tier === 'monograph' ? 'monograph_confirmation' :
                        tier === 'enhanced' ? 'enhanced_confirmation' :
                        'free_tier_welcome',
            status: 'sent',
            channel: 'email',
            providerId: messageId,
            recipient: assessment.email,
            subject: emailTemplate.subject,
            message: emailTemplate.html.substring(0, 500)
          })

          await logEvent('email_sent_initial_assessment', {
            assessmentId: assessment.id,
            tier
          })
        }
      }
    }

    // Log if no delivery method was successful
    if (!deliverySuccess && !errorMessage) {
      errorMessage = 'No valid delivery method available'
      console.log('[Guide Delivery] No delivery method succeeded for assessment:', assessmentId)
    }
    
    // Update delivery status with detailed error message
    await supabase
      .from('guide_deliveries')
      .update({
        delivery_status: deliverySuccess ? 'sent' : 'failed',
        delivered_at: deliverySuccess ? new Date().toISOString() : null,
        error_message: deliverySuccess ? null : (errorMessage || 'Delivery failed - unknown error')
      })
      .eq('assessment_id', assessmentId)
    
    // Update assessment
    if (deliverySuccess) {
      await supabase
        .from('assessments')
        .update({
          guide_delivered_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
    }
    
    // Schedule 14-day follow-up
    if (deliverySuccess) {
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 14)
      
      await supabase
        .from('follow_ups')
        .insert({
          assessment_id: assessmentId,
          scheduled_for: followUpDate.toISOString()
        })
    }
    
    return deliverySuccess
  } catch (error) {
    console.error('Guide delivery error:', error)
    return false
  }
}