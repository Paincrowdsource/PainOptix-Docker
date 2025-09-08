'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPixel, handleRouteChange } from '@/lib/pixel';

/**
 * Meta Pixel Provider Component
 * Handles pixel initialization and route change tracking for Next.js App Router
 */
export function PixelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize pixel on mount
  useEffect(() => {
    initPixel();
  }, []);

  // Track route changes
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      handleRouteChange(url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}