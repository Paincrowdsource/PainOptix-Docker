import { Metadata } from 'next';
import ComprehensiveCareClient from './client';
import { defaultMetadata, pageMetadata } from '@/lib/metadata';

// Server-side feature flag check
const isFeatureEnabled = process.env.FEATURE_BUNDLE_350 === 'true';

export const metadata: Metadata = {
  ...defaultMetadata,
  title: pageMetadata.comprehensiveCare.title,
  description: pageMetadata.comprehensiveCare.description,
  openGraph: {
    ...defaultMetadata.openGraph,
    title: pageMetadata.comprehensiveCare.title,
    description: pageMetadata.comprehensiveCare.description,
  },
  twitter: {
    ...defaultMetadata.twitter,
    title: pageMetadata.comprehensiveCare.title,
    description: pageMetadata.comprehensiveCare.description,
  },
  robots: 'noindex' // Prevent indexing until launch
};

export default function ComprehensiveCarePage() {
  // Server-side feature flag check
  if (!isFeatureEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h1>
          <p className="text-gray-600">
            Our Comprehensive Care Bundle will be available soon. Please check back later.
          </p>
        </div>
      </div>
    );
  }
  
  return <ComprehensiveCareClient />;
}