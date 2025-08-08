// Feature configuration based on environment variables
export const features = {
  smsEnabled: !!(
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_MESSAGE_SERVICE_SID &&
    process.env.TWILIO_ACCOUNT_SID !== 'placeholder' &&
    process.env.TWILIO_AUTH_TOKEN !== 'placeholder' &&
    process.env.TWILIO_MESSAGE_SERVICE_SID !== 'placeholder'
  ),
  emailEnabled: !!(
    process.env.SENDGRID_API_KEY && 
    process.env.SENDGRID_API_KEY !== 'placeholder' &&
    process.env.SENDGRID_API_KEY.startsWith('SG.')
  )
};

// Contact method configuration
export const contactMethods = {
  requiresContact: true, // Always require at least one contact method
  allowsEmailOnly: true,
  allowsSmsOnly: features.smsEnabled, // Only allow SMS-only if SMS is enabled
  preferredMethod: features.smsEnabled ? 'both' : 'email' as 'email' | 'sms' | 'both'
};

// Get available contact methods for UI
export function getAvailableContactMethods() {
  const methods = [];
  
  if (features.emailEnabled) {
    methods.push({
      id: 'email',
      label: 'Email',
      description: 'Receive your guide via email',
      required: !features.smsEnabled // Email is required if SMS is not available
    });
  }
  
  if (features.smsEnabled) {
    methods.push({
      id: 'sms',
      label: 'SMS',
      description: 'Get a text with download link',
      required: false
    });
  }
  
  return methods;
}

// Validate contact configuration on startup
export function validateContactConfiguration() {
  if (!features.emailEnabled && !features.smsEnabled) {
    throw new Error(
      'At least one contact method must be configured. ' +
      'Please set up either SendGrid (email) or Twilio (SMS) credentials.'
    );
  }
  
  if (!features.emailEnabled) {
    console.warn(
      '⚠️  Email is not configured. Only SMS delivery will be available. ' +
      'This is not recommended for production.'
    );
  }
  
  if (!features.smsEnabled) {
    console.log('ℹ️  SMS is not configured. Email-only delivery will be used.');
  }
  
  return true;
}