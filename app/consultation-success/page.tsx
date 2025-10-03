'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ConsultationSuccessPage() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get('assessment');
  const [copied, setCopied] = useState(false);

  const phoneNumber = '254-393-2114';
  const website = 'drcpainmd.com';

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your consultation with Dr. Carpentier has been confirmed
          </p>
          <p className="text-lg text-blue-600 font-semibold">
            Plus: You now have access to the Comprehensive Monograph
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Next Step: Schedule Your Consultation
          </h2>

          {/* Phone Number Section */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <p className="text-gray-700 mb-4 text-lg">
              Please call Dr. Carpentier's office to schedule your 45-minute phone consultation:
            </p>
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-blue-300">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-3xl font-bold text-blue-600">
                  {phoneNumber}
                </span>
              </div>
              <button
                onClick={copyPhoneNumber}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">
              When You Call:
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 text-xl">1.</span>
                <span>Mention that you purchased a PainOptix consultation</span>
              </li>
              {assessmentId && (
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 text-xl">2.</span>
                  <span>
                    Have your assessment ID ready:{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {assessmentId}
                    </code>
                  </span>
                </li>
              )}
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 text-xl">{assessmentId ? '3' : '2'}.</span>
                <span>Schedule a convenient time for your 45-minute phone consultation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 text-xl">{assessmentId ? '4' : '3'}.</span>
                <span>Have your PainOptix assessment results available during the call</span>
              </li>
            </ul>
          </div>

          {/* Website Reference */}
          <div className="border-t pt-6">
            <p className="text-gray-600 text-center">
              Learn more about Dr. Carpentier at{' '}
              <a
                href={`https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                {website}
              </a>
            </p>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Important Reminders
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Your consultation must be scheduled within 30 days of purchase</li>
            <li>• This is a phone consultation (not in-person or video call)</li>
            <li>• Please have your assessment results ready for reference</li>
            <li>• For medical emergencies, always call 911 or visit your nearest emergency room</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          {assessmentId && (
            <>
              <a
                href={`/guide/${assessmentId}`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Download Your Monograph
              </a>
              <a
                href={`/guide/${assessmentId}`}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 rounded-lg font-semibold transition-colors"
              >
                View Assessment Results
              </a>
            </>
          )}
          {!assessmentId && (
            <a
              href="/"
              className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-semibold transition-colors"
            >
              Return to Homepage
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            Save this information for your records. You can also access your assessment results anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
