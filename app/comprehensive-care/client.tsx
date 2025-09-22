'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ComprehensiveCareClient() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get('assessment');

  const handlePurchase = async () => {
    if (!assessmentId) {
      alert('Assessment ID required. Please complete an assessment first.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUNDLE_350,
          bundleType: 'comprehensive'
        })
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Unable to process purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Care Bundle
          </h1>
          <p className="text-xl text-gray-600">
            Complete educational resources, personalized support, and professional consultation
          </p>
        </div>

        {/* Bundle Contents */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">What&apos;s Included</h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">$350</div>
              <div className="text-sm text-gray-500">One-time payment</div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Monograph */}
            <div className="border-l-4 border-purple-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete Educational Monograph
              </h3>
              <p className="text-gray-600 mb-2">
                Our most comprehensive educational resource (normally $20)
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li>- Medical illustrations for visual understanding</li>
                <li>- Comprehensive guide to diagnostic imaging</li>
                <li>- Evidence-based educational content</li>
                <li>- Progress tracking guidance</li>
                <li>- Communication templates for healthcare discussions</li>
              </ul>
            </div>

            {/* Coaching */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                3-Month Educational Support Program
              </h3>
              <p className="text-gray-600 mb-2">
                Weekly educational support to help you understand and implement recommendations
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li>- Weekly educational check-ins</li>
                <li>- Personalized implementation guidance</li>
                <li>- Direct answers to your questions</li>
                <li>- Accountability and motivation support</li>
                <li>- Ongoing educational resources</li>
              </ul>
            </div>

            {/* Telehealth */}
            <div className="border-l-4 border-green-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                45-Minute Professional Consultation
              </h3>
              <p className="text-gray-600 mb-2">
                Professional consultation with a qualified healthcare provider
              </p>
              <ul className="space-y-1 text-sm text-gray-500">
                <li>- Review your assessment findings</li>
                <li>- Discuss your specific situation</li>
                <li>- Professional medical guidance</li>
                <li>- Follow-up care recommendations</li>
                <li>- Schedule within 7 days of purchase</li>
              </ul>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="mt-8 p-6 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Educational Value</h3>
            <p className="text-gray-600 text-sm">
              This bundle combines our premium educational materials with personalized support 
              and professional consultation. It&apos;s designed for those seeking the most 
              comprehensive educational approach to understanding their condition.
            </p>
          </div>
        </div>

        {/* Who This Is For */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Who This Bundle Is For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2"> Ideal For:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>- Those seeking comprehensive educational resources</li>
                <li>- People who want professional medical guidance</li>
                <li>- Anyone ready for structured educational support</li>
                <li>- Those who value personalized guidance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-600 mb-2">âœ— May Not Be Necessary If:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>- You prefer self-directed learning</li>
                <li>- You already have regular medical care</li>
                <li>- Your situation is improving</li>
                <li>- You prefer minimal support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready for Comprehensive Support?</h2>
          <p className="mb-6">
            Get everything you need for comprehensive educational support.
          </p>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Get the Comprehensive Bundle - $350'}
          </button>
          <p className="mt-4 text-sm opacity-90">
            Secure payment via Stripe. Immediate access to educational materials.
          </p>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Educational Disclaimer</p>
          <p>
            This bundle provides educational materials and support services. The professional 
            consultation is with a licensed healthcare provider. This educational bundle is 
            designed to support your understanding. Always work with your healthcare 
            providers for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}





