import { Suspense } from 'react';
import ConversionMetricsClient from './ConversionMetricsClient';

export const dynamic = 'force-dynamic';

export default function ConversionMetricsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversion Metrics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track assessment-to-email conversion performance. Goal: Improve email capture from 36% baseline to 55% target.
        </p>
      </div>

      <Suspense fallback={<div className="text-gray-500">Loading metrics...</div>}>
        <ConversionMetricsClient />
      </Suspense>
    </div>
  );
}
