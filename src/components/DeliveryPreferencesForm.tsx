import React, { useState } from 'react';
import { FieldGroup, FormLabel, FormRadioGroup, FormRadioItem, FormInput, FormCheckbox } from './FieldGroup';
import { Shield, Lock, Award, CheckCircle, Mail, MessageSquare, ChevronRight, Send, Loader2 } from 'lucide-react';

interface DeliveryPreferencesFormProps {
  assessmentId: string;
  prefillEmail?: string;
  prefillName?: string;
  guideType?: string;
  disclosures?: string[];
  responses?: Array<{ questionId: string; question: string; answer: string }>;
  initialPainScore?: number;
  onSuccess: (assessmentId: string) => void;
  onBack?: () => void;
}

export const DeliveryPreferencesForm: React.FC<DeliveryPreferencesFormProps> = ({
  assessmentId,
  prefillEmail = '',
  prefillName = '',
  guideType,
  disclosures = [],
  responses = [],
  initialPainScore = 5,
  onSuccess,
  onBack
}) => {
  // Default to SMS (phone preferred)
  const [deliveryMethod, setDeliveryMethod] = useState<'sms' | 'email'>('sms');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Phone number formatting - (xxx) xxx-xxxx
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  // Parse phone to API format: +1xxxxxxxxxx
  const parsePhoneNumber = (formatted: string): string => {
    const digits = formatted.replace(/\D/g, '');
    return digits.length === 10 ? `+1${digits}` : digits;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (deliveryMethod === 'sms') {
      if (!phoneNumber) {
        newErrors.phone = 'Phone number is required for text delivery';
      } else {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length !== 10) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        }
      }
      if (smsOptIn === false) {
        newErrors.smsOptIn = 'You must agree to receive text messages';
      }
    }

    if (deliveryMethod === 'email') {
      if (!email) {
        newErrors.email = 'Email is required for email delivery';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Build the payload for the assessment API
      const payload = {
        responses,
        name: prefillName,
        contactMethod: deliveryMethod,
        email: email || undefined,
        phoneNumber: deliveryMethod === 'sms' ? parsePhoneNumber(phoneNumber) : undefined,
        initialPainScore,
        referrerSource: typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ref') || 'organic'
          : 'organic',
        guideType,
        disclosures,
        smsOptIn: deliveryMethod === 'sms' ? smsOptIn : false,
        deliveryMethod
      };

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit');
      }

      // Success - redirect to guide page
      onSuccess(result.assessmentId);
    } catch (error: any) {
      console.error('Delivery submission error:', error);
      setErrors({ submit: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white -m-8 p-8">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.01]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230B5394' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-medium">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm text-gray-600">Assessment Complete</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0B5394] text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm font-medium text-gray-900">Delivery Preferences</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#0B5394] to-[#084074] px-8 py-6">
            <div className="flex items-center gap-3 mb-3">
              <Send className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-normal text-white">
                Where should we send your personalized plan?
              </h2>
            </div>
            <p className="text-blue-100">
              Your comprehensive guide will be delivered instantly. Free, no payment required.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Delivery Method Selection */}
            <div className="mb-6">
              <FormLabel className="text-lg font-medium mb-4 block">
                How would you like to receive your guide?
              </FormLabel>
              <FieldGroup>
                <FormRadioGroup
                  value={deliveryMethod}
                  onValueChange={(value) => setDeliveryMethod(value as 'sms' | 'email')}
                >
                  <FormRadioItem value="sms" id="delivery-sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                      Text Message (SMS)
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                  </FormRadioItem>
                  <FormRadioItem value="email" id="delivery-email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      Email
                    </div>
                  </FormRadioItem>
                </FormRadioGroup>
              </FieldGroup>
            </div>

            {/* Phone Number Input (shown when SMS selected) */}
            {deliveryMethod === 'sms' && (
              <div className="mb-6">
                <FormLabel htmlFor="phoneNumber" required>
                  Phone Number
                </FormLabel>
                <FormInput
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  error={errors.phone}
                  required
                />
              </div>
            )}

            {/* Email Input */}
            <div className="mb-6">
              <FormLabel htmlFor="email" required={deliveryMethod === 'email'}>
                Email Address {deliveryMethod === 'sms' && <span className="text-gray-500 font-normal">(optional backup)</span>}
              </FormLabel>
              <FormInput
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="your@email.com"
                error={errors.email}
                required={deliveryMethod === 'email'}
              />
            </div>

            {/* SMS Opt-In Checkbox (shown when SMS selected) */}
            {deliveryMethod === 'sms' && (
              <div className="mb-6">
                <FieldGroup>
                  <FormCheckbox
                    id="smsOptIn"
                    checked={smsOptIn}
                    onCheckedChange={setSmsOptIn}
                  >
                    <span className="text-sm">
                      Yes, text me my plan and the 14-day check-in sequence.
                      <span className="block text-xs text-gray-500 mt-1">
                        Message and data rates may apply. Reply STOP to unsubscribe.
                      </span>
                    </span>
                  </FormCheckbox>
                </FieldGroup>
                {errors.smsOptIn && (
                  <p className="text-red-500 text-sm mt-2">{errors.smsOptIn}</p>
                )}
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-100">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 bg-[#0B5394] text-white rounded-lg hover:bg-[#084074] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium shadow-sm flex items-center gap-2 ${!onBack ? 'w-full justify-center' : 'ml-auto'}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Get My Free Plan
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-[#0B5394]" />
              <span className="text-sm font-medium text-gray-900">HIPAA Compliant</span>
              <span className="text-xs text-gray-600">Your data is secure</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Lock className="w-8 h-8 text-[#0B5394]" />
              <span className="text-sm font-medium text-gray-900">SSL Encrypted</span>
              <span className="text-xs text-gray-600">256-bit security</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="w-8 h-8 text-[#0B5394]" />
              <span className="text-sm font-medium text-gray-900">Medical Experts</span>
              <span className="text-xs text-gray-600">Evidence-based</span>
            </div>
          </div>
        </div>

        {/* Free Guarantee */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 inline-block text-green-500 mr-1" />
            100% Free. No credit card required. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
};
