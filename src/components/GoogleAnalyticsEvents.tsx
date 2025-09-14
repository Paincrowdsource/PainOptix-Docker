'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function GoogleAnalyticsEvents() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track if gtag is available
    if (typeof window !== 'undefined' && window.gtag) {
      // Just use pathname without search params to avoid SSR issues
      // Search params will be included in page_location anyway
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true
      });
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}