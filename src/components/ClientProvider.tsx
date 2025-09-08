'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import dynamic from 'next/dynamic';

// Dynamically import MetaPixel with no SSR
const MetaPixel = dynamic(() => import('./MetaPixel'), { ssr: false });

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  return (
    <ErrorBoundary>
      <MetaPixel />
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
    </ErrorBoundary>
  );
}