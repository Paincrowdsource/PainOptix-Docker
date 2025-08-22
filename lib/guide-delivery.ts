import { getServiceSupabase } from './supabase'
import { sendEmail, sendSMS } from './communications'
import { getEducationalGuideEmailTemplate, getSMSTemplate } from './email-templates/educational-guide'
import { getFreeTierWelcomeTemplate } from './email/templates/free-tier-welcome'
import { getEnhancedConfirmationTemplate } from './email/templates/enhanced-confirmation'
import { getMonographConfirmationTemplate } from './email/templates/monograph-confirmation'
import { resolveTierAndFlags } from './email/resolve-tier'
import { features } from './config'

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
      
      let emailTemplate: { subject: string; html: string; text: string }
      
      if (tier === 'monograph') {
        const html = getMonographConfirmationTemplate({ 
          assessmentResults: assessment.responses,
          userTier: tier 
        })
        emailTemplate = {
          subject: 'Your Complete Educational Monograph is Ready',
          html,
          text: 'Your Complete Educational Monograph is Ready. Please view this email in HTML format.'
        }
      } else if (tier === 'enhanced') {
        const html = getEnhancedConfirmationTemplate({ 
          assessmentResults: assessment.responses,
          userTier: tier 
        })
        emailTemplate = {
          subject: 'Your Enhanced Educational Report is Ready',
          html,
          text: 'Your Enhanced Educational Report is Ready. Please view this email in HTML format.'
        }
      } else {
        const html = getFreeTierWelcomeTemplate({ 
          assessmentResults: assessment.responses,
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
          
          let emailTemplate: { subject: string; html: string; text: string }
          
          if (tier === 'monograph') {
            const html = getMonographConfirmationTemplate({ 
              assessmentResults: assessment.responses,
              userTier: tier 
            })
            emailTemplate = {
              subject: 'Your Complete Educational Monograph is Ready',
              html,
              text: 'Your Complete Educational Monograph is Ready. Please view this email in HTML format.'
            }
          } else if (tier === 'enhanced') {
            const html = getEnhancedConfirmationTemplate({ 
              assessmentResults: assessment.responses,
              userTier: tier 
            })
            emailTemplate = {
              subject: 'Your Enhanced Educational Report is Ready',
              html,
              text: 'Your Enhanced Educational Report is Ready. Please view this email in HTML format.'
            }
          } else {
            const html = getFreeTierWelcomeTemplate({ 
              assessmentResults: assessment.responses,
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