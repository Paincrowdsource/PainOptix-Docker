import { getServiceSupabase } from './supabase'
import { sendEmail, sendSMS } from './communications'
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

export async function deliverEducationalGuide(assessmentId: string) {
  const supabase = getServiceSupabase()
  
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
    
    if (assessment.email) {
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
        while (deliveryAttempts < maxRetries && !deliverySuccess) {
          deliveryAttempts++
          
          try {
            deliverySuccess = await sendEmail({
              to: assessment.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text
            })
            
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
    } else if (assessment.phone_number) {
      // Try SMS if available
      if (features.smsEnabled) {
        const smsMessage = getSMSTemplate({
          guideType: assessment.guide_type,
          assessmentId: assessment.id,
        })
        
        deliverySuccess = await sendSMS({
          to: assessment.phone_number,
          message: smsMessage
        })

        // Log SMS delivery attempt
        if (deliverySuccess) {
          await logCommunication({
            assessmentId: assessment.id,
            templateKey: 'guide_sms_delivery',
            status: 'sent',
            channel: 'sms',
            recipient: assessment.phone_number,
            message: smsMessage.substring(0, 500)
          })

          await logEvent('sms_sent_initial_assessment', {
            assessmentId: assessment.id
          })
        } else {
          // Log failed SMS attempt
          await logCommunication({
            assessmentId: assessment.id,
            templateKey: 'guide_sms_delivery',
            status: 'failed',
            channel: 'sms',
            recipient: assessment.phone_number,
            message: smsMessage.substring(0, 500),
            errorMessage: 'SMS delivery failed'
          })
        }

        // If SMS fails and we have an email, try email as fallback
        if (!deliverySuccess && assessment.email) {
          console.log('SMS delivery failed, falling back to email')
          
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
          
          deliverySuccess = await sendEmail({
            to: assessment.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          })
          
          // Log the SMS fallback email if successful
          if (deliverySuccess) {
            await logCommunication({
              assessmentId: assessment.id,
              templateKey: tier === 'monograph' ? 'monograph_confirmation' : 
                          tier === 'enhanced' ? 'enhanced_confirmation' : 
                          'free_tier_welcome',
              status: 'sent',
              channel: 'email',
              recipient: assessment.email,
              subject: emailTemplate.subject,
              message: emailTemplate.html.substring(0, 500)
            })
            
            await logEvent('email_sent_sms_fallback', { 
              assessmentId: assessment.id, 
              tier 
            })
          }
        }
      } else {
        // SMS not available, log warning
        console.warn('SMS delivery requested but SMS is not enabled')
        errorMessage = 'SMS delivery not available'
      }
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