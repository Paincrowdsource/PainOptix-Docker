'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Meta Pixel Provider Component
 * Handles pixel initialization and route change tracking for Next.js App Router
 */
export function PixelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize pixel on mount
  useEffect(() => {
    // Dynamically import pixel to ensure it only loads on client
    import('@/lib/pixel').then(({ initPixel }) => {
      initPixel();
    }).catch((error) => {
      console.error('[PixelProvider] Failed to load pixel:', error);
    });
  }, []);

  // Track route changes
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      // Dynamically import to handle route changes
      import('@/lib/pixel').then(({ handleRouteChange }) => {
        handleRouteChange(url);
      }).catch((error) => {
        console.error('[PixelProvider] Failed to track route change:', error);
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}