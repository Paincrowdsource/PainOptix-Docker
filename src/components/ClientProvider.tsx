'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { PixelProvider } from './PixelProvider';
import GoogleAnalytics from './GoogleAnalytics';
import GoogleAnalyticsEvents from './GoogleAnalyticsEvents';

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  // Only render GA events tracking after mount to avoid SSR issues
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ErrorBoundary>
      <PixelProvider>
        <GoogleAnalytics />
        {mounted && <GoogleAnalyticsEvents />}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {children}
      </PixelProvider>
    </ErrorBoundary>
  );
}