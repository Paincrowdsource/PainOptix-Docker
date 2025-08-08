// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Pre-defined event trackers
export const trackAssessmentStart = () => {
  trackEvent('assessment_start', 'engagement')
}

export const trackAssessmentComplete = (guideType: string) => {
  trackEvent('assessment_complete', 'engagement', guideType)
}

export const trackUpgradeClick = (tier: string, guideType: string) => {
  trackEvent('upgrade_click', 'conversion', `${tier}_${guideType}`)
}

export const trackPaymentComplete = (tier: string, amount: number) => {
  trackEvent('payment_complete', 'conversion', tier, amount)
}

export const trackGuideDownload = (guideType: string, tier: string) => {
  trackEvent('guide_download', 'engagement', `${guideType}_${tier}`)
}

export const trackEmailSent = (success: boolean) => {
  trackEvent('email_sent', 'communication', success ? 'success' : 'failed')
}

export const trackSMSSent = (success: boolean) => {
  trackEvent('sms_sent', 'communication', success ? 'success' : 'failed')
}

export const trackFollowUpResponse = () => {
  trackEvent('follow_up_response', 'engagement')
}

// Page view tracking (for SPAs)
export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_path: path,
    })
  }
}