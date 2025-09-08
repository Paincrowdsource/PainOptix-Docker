/**
 * Meta Pixel Event Definitions for PainOptix
 * Standard events for the assessment and purchase flow
 * Uses dynamic imports to ensure client-side only execution
 */

/**
 * Track when a user starts the assessment
 */
export const trackAssessmentStarted = async () => {
  if (typeof window === 'undefined') return;
  
  const { trackEvent } = await import('@/lib/pixel');
  trackEvent('InitiateCheckout', {
    content_category: 'assessment',
    content_type: 'pain_assessment',
  });
};

/**
 * Track when a user completes the assessment questions
 */
export const trackAssessmentCompleted = async (diagnosisType?: string) => {
  if (typeof window === 'undefined') return;
  
  const { trackEvent } = await import('@/lib/pixel');
  trackEvent('Lead', {
    content_category: 'assessment_complete',
    content_name: diagnosisType || 'unknown',
  });
};

/**
 * Track when a user submits contact info
 */
export const trackContactInfoSubmitted = async () => {
  if (typeof window === 'undefined') return;
  
  const { trackEvent } = await import('@/lib/pixel');
  trackEvent('CompleteRegistration', {
    content_name: 'email_submission',
    status: true,
  });
};

/**
 * Track when a user views pricing options
 */
export const trackViewPricing = async (tier?: string) => {
  if (typeof window === 'undefined') return;
  
  const { trackEvent } = await import('@/lib/pixel');
  trackEvent('ViewContent', {
    content_category: 'pricing',
    content_name: tier || 'all_tiers',
    content_type: 'product',
  });
};

/**
 * Track when a user initiates a purchase
 */
export const trackPurchaseInitiated = async (tier: string, value: number) => {
  if (typeof window === 'undefined') return;
  
  const { trackEvent } = await import('@/lib/pixel');
  trackEvent('AddToCart', {
    content_category: 'guide',
    content_name: tier,
    content_type: 'product',
    value: value,
    currency: 'USD',
  });
};

/**
 * Track when a purchase is completed
 */
export const trackPurchaseCompleted = async (tier: string, value: number, assessmentId: string) => {
  if (typeof window === 'undefined') return;
  
  const { trackEvent } = await import('@/lib/pixel');
  trackEvent('Purchase', {
    content_category: 'guide',
    content_name: tier,
    content_type: 'product',
    content_ids: [assessmentId],
    value: value,
    currency: 'USD',
  });
};

/**
 * Track when a user downloads their guide
 */
export const trackGuideDownloaded = async (tier: string) => {
  if (typeof window === 'undefined') return;
  
  const { trackCustomEvent } = await import('@/lib/pixel');
  trackCustomEvent('GuideDownloaded', {
    tier: tier,
    action: 'download',
  });
};

/**
 * Track when a follow-up email is opened (via tracking pixel)
 */
export const trackFollowUpOpened = async (dayNumber: number) => {
  if (typeof window === 'undefined') return;
  
  const { trackCustomEvent } = await import('@/lib/pixel');
  trackCustomEvent('FollowUpEngagement', {
    day: dayNumber,
    action: 'email_opened',
  });
};

/**
 * Track when a user clicks "Delete My Data"
 */
export const trackDataDeletionRequested = async () => {
  if (typeof window === 'undefined') return;
  
  const { trackCustomEvent } = await import('@/lib/pixel');
  trackCustomEvent('DataDeletionRequest', {
    action: 'requested',
  });
};

/**
 * Track referrer source
 */
export const trackReferrerSource = async (source: string) => {
  if (typeof window === 'undefined') return;
  
  const { trackCustomEvent } = await import('@/lib/pixel');
  trackCustomEvent('ReferrerTracked', {
    source: source,
    timestamp: new Date().toISOString(),
  });
};