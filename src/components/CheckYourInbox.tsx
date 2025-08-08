import React from 'react';

interface CheckYourInboxProps {
  contactMethod: 'email' | 'sms';
  contactInfo: string;
}

export const CheckYourInbox: React.FC<CheckYourInboxProps> = ({ contactMethod, contactInfo }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-2xl mx-auto text-center px-4">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Assessment Complete!
        </h1>
        
        <div className="medical-card mb-8">
          <p className="text-lg text-gray-700 mb-4">
            Your personalized Educational Guide has been sent to:
          </p>
          
          <p className="text-xl font-semibold text-blue-600 mb-6">
            {contactInfo}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Delivery Time:</strong> 2-3 minutes
            </p>
            <p className="text-sm text-blue-800">
              <strong>Check your {contactMethod === 'email' ? 'inbox and spam folder' : 'messages'}</strong>
            </p>
          </div>
        </div>
        
        <div className="medical-card">
          <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <p className="text-gray-700">
                Open your {contactMethod === 'email' ? 'email' : 'text message'} to access your Educational Guide
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <p className="text-gray-700">
                Review your personalized information based on your symptoms
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <p className="text-gray-700">
                Consider enhanced guides for detailed treatment information
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">4</span>
              </div>
              <p className="text-gray-700">
                We&apos;ll check in with you in 14 days to track your progress
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@painoptix.com" className="text-blue-600 hover:underline">
              support@painoptix.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};