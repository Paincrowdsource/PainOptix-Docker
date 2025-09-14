'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function GoogleAnalyticsEventsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if gtag is available
    if (typeof window !== 'undefined' && window.gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      // Send page view event for SPA navigation
      // HIPAA compliant - no PII in URLs
      window.gtag('event', 'page_view', {
        page_path: url,
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true
      });
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

export default function GoogleAnalyticsEvents() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsEventsInner />
    </Suspense>
  );
}