/**
 * Meta Pixel Event Definitions for PainOptix
 * Standard events for the assessment and purchase flow
 */

import { trackEvent, trackCustomEvent } from '@/lib/pixel';

/**
 * Track when a user starts the assessment
 */
export const trackAssessmentStarted = () => {
  trackEvent('InitiateCheckout', {
    content_category: 'assessment',
    content_type: 'pain_assessment',
  });
};

/**
 * Track when a user completes the assessment questions
 */
export const trackAssessmentCompleted = (diagnosisType?: string) => {
  trackEvent('Lead', {
    content_category: 'assessment_complete',
    content_name: diagnosisType || 'unknown',
  });
};

/**
 * Track when a user submits contact info
 */
export const trackContactInfoSubmitted = () => {
  trackEvent('CompleteRegistration', {
    content_name: 'email_submission',
    status: true,
  });
};

/**
 * Track when a user views pricing options
 */
export const trackViewPricing = (tier?: string) => {
  trackEvent('ViewContent', {
    content_category: 'pricing',
    content_name: tier || 'all_tiers',
    content_type: 'product',
  });
};

/**
 * Track when a user initiates a purchase
 */
export const trackPurchaseInitiated = (tier: string, value: number) => {
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
export const trackPurchaseCompleted = (tier: string, value: number, assessmentId: string) => {
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
export const trackGuideDownloaded = (tier: string) => {
  trackCustomEvent('GuideDownloaded', {
    tier: tier,
    action: 'download',
  });
};

/**
 * Track when a follow-up email is opened (via tracking pixel)
 */
export const trackFollowUpOpened = (dayNumber: number) => {
  trackCustomEvent('FollowUpEngagement', {
    day: dayNumber,
    action: 'email_opened',
  });
};

/**
 * Track when a user clicks "Delete My Data"
 */
export const trackDataDeletionRequested = () => {
  trackCustomEvent('DataDeletionRequest', {
    action: 'requested',
  });
};

/**
 * Track referrer source
 */
export const trackReferrerSource = (source: string) => {
  trackCustomEvent('ReferrerTracked', {
    source: source,
    timestamp: new Date().toISOString(),
  });
};