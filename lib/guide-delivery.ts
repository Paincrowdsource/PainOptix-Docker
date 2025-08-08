import { getServiceSupabase } from './supabase'
import { sendEmail, sendSMS } from './communications'
import { getEducationalGuideEmailTemplate, getSMSTemplate } from './email-templates/educational-guide'
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
      
      const emailTemplate = getEducationalGuideEmailTemplate({
        guideType: assessment.guide_type,
        assessmentId: assessment.id,
        firstName: firstName || 'Patient',
        relievingFactors: assessment.responses?.find((r: any) => r.questionId === 'Q5')?.answer || 'certain positions',
        aggravatingFactors: assessment.responses?.find((r: any) => r.questionId === 'Q4')?.answer || 'certain activities'
      })
      
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
          
          const emailTemplate = getEducationalGuideEmailTemplate({
            guideType: assessment.guide_type,
            assessmentId: assessment.id,
            firstName: firstName || 'Patient',
            relievingFactors: assessment.responses?.find((r: any) => r.questionId === 'Q5')?.answer || 'certain positions',
            aggravatingFactors: assessment.responses?.find((r: any) => r.questionId === 'Q4')?.answer || 'certain activities'
          })
          
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