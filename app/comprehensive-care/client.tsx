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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Consultation with Dr. Carpentier
          </h1>
          <p className="text-xl text-gray-600">
            Get personalized medical guidance from an experienced healthcare provider
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Telehealth Consultation</h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">$350</div>
              <div className="text-sm text-gray-500">Includes Monograph ($20 value)</div>
            </div>
          </div>

          <div className="space-y-6">
            {/* What's Included */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What&apos;s Included
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>45-Minute Phone Consultation</strong> with Dr. Carpentier</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>Comprehensive Monograph</strong> - Complete educational guide with professional illustrations ($20 value)</span>
                </li>
              </ul>
            </div>

            {/* Consultation Details */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Professional Medical Consultation
              </h3>
              <p className="text-gray-600 mb-4">
                Direct phone consultation with Dr. Carpentier to discuss your specific situation
                and receive professional medical guidance.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Review your PainOptix assessment results in detail</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Discuss your specific symptoms and medical history</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Receive personalized medical recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Get answers to your specific questions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Understand next steps for your care</span>
                </li>
              </ul>
            </div>

            {/* How It Works */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
              <ol className="space-y-3 text-gray-600">
                <li className="flex">
                  <span className="font-semibold text-blue-600 mr-3">1.</span>
                  <span>Complete your purchase through our secure payment system</span>
                </li>
                <li className="flex">
                  <span className="font-semibold text-blue-600 mr-3">2.</span>
                  <span>View Dr. Carpentier&apos;s contact information on the confirmation page</span>
                </li>
                <li className="flex">
                  <span className="font-semibold text-blue-600 mr-3">3.</span>
                  <span>Call to schedule your consultation at a convenient time</span>
                </li>
                <li className="flex">
                  <span className="font-semibold text-blue-600 mr-3">4.</span>
                  <span>Have your assessment results ready for the consultation</span>
                </li>
              </ol>
            </div>

            {/* About Dr. Carpentier */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">About Dr. Carpentier</h3>
              <p className="text-gray-600">
                Dr. Carpentier is an experienced healthcare provider specializing in musculoskeletal
                conditions and pain management. He brings years of clinical experience to help you
                understand your condition and develop an effective treatment approach.
              </p>
            </div>
          </div>
        </div>

        {/* Who This Is For */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Is This Consultation Right for You?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-3">✓ Ideal For:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• You want professional medical guidance</li>
                <li>• Your symptoms are complex or persistent</li>
                <li>• You have specific questions about your condition</li>
                <li>• You want personalized treatment recommendations</li>
                <li>• You&apos;re not improving with current approaches</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-amber-600 mb-3">Consider If:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• You already have a treating physician</li>
                <li>• Your symptoms are mild and improving</li>
                <li>• You prefer in-person consultations</li>
                <li>• You need immediate emergency care</li>
                <li>• You&apos;re looking for a second opinion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Professional Guidance?</h2>
          <p className="mb-6">
            Schedule your consultation with Dr. Carpentier and get the answers you need.
          </p>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Book Consultation - $350'}
          </button>
          <p className="mt-4 text-sm opacity-90">
            Secure payment via Stripe. Consultation details sent immediately.
          </p>
        </div>

        {/* Important Information */}
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="font-semibold text-gray-900 mb-2">Important Information</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• This is a telehealth consultation conducted via phone</li>
            <li>• Consultation must be scheduled within 30 days of purchase</li>
            <li>• Have your PainOptix assessment results available during the call</li>
            <li>• For emergencies, always call 911 or visit your nearest emergency room</li>
          </ul>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Medical Disclaimer</p>
          <p>
            This consultation provides professional medical advice based on your individual situation.
            Dr. Carpentier will review your case and provide recommendations, but this consultation
            does not establish an ongoing doctor-patient relationship. For continuous care,
            please follow up with a local healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}