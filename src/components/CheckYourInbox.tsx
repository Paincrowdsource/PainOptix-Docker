import React from 'react';
import { CheckCircle, MessageSquare, Mail, Clock, Shield, Lock } from 'lucide-react';

interface CheckYourInboxProps {
  contactMethod: 'email' | 'sms';
  contactInfo: string;
}

export const CheckYourInbox: React.FC<CheckYourInboxProps> = ({ contactMethod, contactInfo }) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white -m-8 p-8">
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B5394] to-[#084074] px-8 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight">
              Your Tracker Is Active
            </h2>
            <p className="text-blue-100 mt-2">Assessment complete. Here&apos;s what happens next.</p>
          </div>

          <div className="p-8 space-y-6">
            {/* Delivery confirmation */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {contactMethod === 'sms' ? (
                  <MessageSquare className="w-5 h-5 text-[#0B5394]" />
                ) : (
                  <Mail className="w-5 h-5 text-[#0B5394]" />
                )}
                <p className="text-sm font-medium text-gray-700">Sent to</p>
              </div>
              <p className="text-lg font-semibold text-[#0B5394]">{contactInfo}</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Arrives in 2-3 minutes</span>
              </div>
            </div>

            {/* What happens next */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">What Happens Next</h2>
              <div className="w-12 h-px bg-[#0B5394] mb-4"></div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-[#0B5394]">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Check your {contactMethod === 'sms' ? 'messages' : 'inbox'}</p>
                    <p className="text-sm text-gray-600">Your Educational Guide is on its way.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-[#0B5394]">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Daily check-in starts tomorrow</p>
                    <p className="text-sm text-gray-600">You&apos;ll receive one text per day asking for your pain score (0-10). Just reply with a number.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-[#0B5394]">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Watch your progress build</p>
                    <p className="text-sm text-gray-600">After a few days, your personal progress chart will show trends in your recovery.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-[#0B5394]">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">14-day review</p>
                    <p className="text-sm text-gray-600">At the end of your tracker, you&apos;ll receive a full summary of your progress.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support link */}
            <p className="text-center text-sm text-gray-500">
              Need help?{' '}
              <a href="mailto:support@painoptix.com" className="text-[#0B5394] hover:underline">
                support@painoptix.com
              </a>
            </p>

            {/* Trust indicators */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-center gap-8">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#0B5394]" />
                  <span className="text-xs text-gray-600">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#0B5394]" />
                  <span className="text-xs text-gray-600">256-bit SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
