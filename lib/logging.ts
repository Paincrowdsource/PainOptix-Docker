/**
 * Logging helper for segmented email system
 * Follows conventions: env, event, detail, request_id, no PII
 */
export async function logEvent(event: string, detail: Record<string, any> = {}) {
  // Get env from multiple sources
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'unknown';
  
  // Extract request_id if provided
  const request_id = (detail.request_id as string) || undefined;
  
  // Create sanitized copy
  const sanitizedDetail = { ...detail };
  
  // NEVER log raw emails - delete immediately
  delete sanitizedDetail.email;
  delete sanitizedDetail.emailAddress;
  delete sanitizedDetail.user_email;
  
  // Remove any other potential PII fields
  const piiFields = ['name', 'phone', 'phone_number', 'address', 'ssn', 'dob', 'password'];
  piiFields.forEach(field => {
    delete sanitizedDetail[field];
  });
  
  // If we need to track an email, hash it
  if (detail.email) {
    const crypto = await import('crypto');
    sanitizedDetail.emailHash = crypto
      .createHash('sha256')
      .update(detail.email.toLowerCase())
      .digest('hex')
      .substring(0, 8);
  }
  
  // Build log payload
  const payload: any = {
    env,
    event,
    detail: sanitizedDetail,
    ts: new Date().toISOString()
  };
  
  // Only add request_id if present
  if (request_id) {
    payload.request_id = request_id;
  }
  
  // Log to console (and any configured services)
  console.log(JSON.stringify(payload));
  
  // If logger service is configured, send there too
  try {
    const { logger } = await import('./logger');
    if (logger && logger.info) {
      logger.info(event, sanitizedDetail);
    }
  } catch {
    // Logger not available, continue with console only
  }
}