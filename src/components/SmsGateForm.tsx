import React, { useState } from 'react';
import { ChevronRight, Loader2, MessageSquare, Shield, Clock, BarChart3 } from 'lucide-react';
import { FormInput, FormLabel } from './FieldGroup';

interface SmsGateFormProps {
  isSubmitting: boolean;
  onSubmit: (data: { phoneNumber: string; email?: string }) => Promise<void> | void;
  onBack: () => void;
}

export const SmsGateForm: React.FC<SmsGateFormProps> = ({ isSubmitting, onSubmit, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [smsConsent, setSmsConsent] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const parsePhoneNumber = (formatted: string): string => {
    const digits = formatted.replace(/\D/g, '');
    return digits.length === 10 ? `+1${digits}` : digits;
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      nextErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email';
    }

    if (!smsConsent) {
      nextErrors.smsConsent = 'SMS consent is required to start tracking';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    await onSubmit({
      phoneNumber: parsePhoneNumber(phoneNumber),
      email: email || undefined,
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white -m-8 p-8">
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B5394] to-[#084074] px-8 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight">Start Your 14-Day Tracker</h2>
            <p className="text-blue-100 mt-2 max-w-md mx-auto">
              One text per day. Reply with your pain score. Watch your progress chart build.
            </p>
          </div>

          {/* Benefit strip */}
          <div className="px-8 pt-6 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Clock className="w-5 h-5 text-[#0B5394] flex-shrink-0" />
                <span className="text-sm text-gray-700">10 seconds per day</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <BarChart3 className="w-5 h-5 text-[#0B5394] flex-shrink-0" />
                <span className="text-sm text-gray-700">Personal progress chart</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Shield className="w-5 h-5 text-[#0B5394] flex-shrink-0" />
                <span className="text-sm text-gray-700">Cancel anytime via STOP</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-4 pb-8 space-y-6">
            {/* Phone field */}
            <div>
              <FormLabel htmlFor="phone" required>
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0B5394]" />
                  Phone Number
                </span>
              </FormLabel>
              <FormInput
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(formatPhoneNumber(e.target.value));
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="(555) 123-4567"
                error={errors.phone}
                required
              />
            </div>

            {/* Email field */}
            <div>
              <FormLabel htmlFor="email">Email (optional)</FormLabel>
              <FormInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="To receive your full personalized monograph PDF"
                error={errors.email}
              />
            </div>

            {/* SMS Consent */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-[#0B5394] focus:ring-[#0B5394]"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">SMS Consent</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    I consent to receive SMS messages from PainOptix / Dr. C. Message and data rates may apply.
                    Reply STOP to unsubscribe.
                  </p>
                </div>
              </label>
              {errors.smsConsent && <p className="text-red-500 text-sm mt-2">{errors.smsConsent}</p>}
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#0B5394] text-white rounded-xl hover:bg-[#084074] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium shadow-sm flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Tracking
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
