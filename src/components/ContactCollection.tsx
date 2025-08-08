import React, { useState } from 'react';
import { FieldGroup, FormLabel, FormRadioGroup, FormRadioItem, FormInput, FormSlider, FormCheckbox } from './FieldGroup';
import { features, getAvailableContactMethods } from '@/lib/config';
import { Shield, Lock, Award, CheckCircle, Mail, MessageSquare, ChevronRight, Activity } from 'lucide-react';

interface ContactCollectionProps {
  onSubmit: (data: ContactData) => void;
  onBack: () => void;
}

interface ContactData {
  name: string;
  contactMethod: 'email' | 'sms';
  email?: string;
  phoneNumber?: string;
  contactConsent: boolean;
  initialPainScore: number;
}

export const ContactCollection: React.FC<ContactCollectionProps> = ({ onSubmit, onBack }) => {
  const availableMethods = getAvailableContactMethods();
  const defaultMethod = features.smsEnabled ? 'email' : 'email'; // Default to email
  
  const [name, setName] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'sms'>(defaultMethod);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [initialPainScore, setInitialPainScore] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (contactMethod === 'email' && !email) {
      newErrors.email = 'Email is required';
    } else if (contactMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (contactMethod === 'sms' && !phoneNumber) {
      newErrors.phone = 'Phone number is required';
    } else if (contactMethod === 'sms' && !/^\+?1?\d{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!contactConsent) {
      newErrors.consent = 'You must agree to receive your results';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: name.trim(),
        contactMethod,
        email: contactMethod === 'email' ? email : undefined,
        phoneNumber: contactMethod === 'sms' ? phoneNumber : undefined,
        contactConsent,
        initialPainScore
      });
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
                <span className="text-sm font-medium text-gray-900">Contact Information</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#0B5394] to-[#084074] px-8 py-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-normal text-white">
                Get Your Personalized Educational Guide
              </h2>
            </div>
            <p className="text-blue-100">
              We&apos;ll send your personalized educational guide and 14-day progress tracker to your preferred contact method.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            <div className="mb-6">
              <FormLabel htmlFor="name" required>
                Full Name
              </FormLabel>
              <FormInput
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                error={errors.name}
                required
                className="medical-input"
              />
            </div>

            {/* Only show contact method selection if both options are available */}
            {features.smsEnabled && features.emailEnabled && (
              <div className="mb-6">
                <FormLabel className="text-lg font-medium mb-4 block">
                  How would you like to receive your guide?
                </FormLabel>
                <FieldGroup>
                  <FormRadioGroup
                    value={contactMethod}
                    onValueChange={(value) => setContactMethod(value as 'email' | 'sms')}
                  >
                    <FormRadioItem value="email" id="method-email">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-600" />
                        Email
                      </div>
                    </FormRadioItem>
                    <FormRadioItem value="sms" id="method-sms">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                        Text Message (SMS)
                      </div>
                    </FormRadioItem>
                  </FormRadioGroup>
                </FieldGroup>
              </div>
            )}
            
            {/* If only email is available, show a message */}
            {!features.smsEnabled && features.emailEnabled && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Your personalized guide will be sent to your email address.
                </p>
              </div>
            )}

            {(contactMethod === 'email' || !features.smsEnabled) && (
              <div className="mb-6">
                <FormLabel htmlFor="email" required>
                  Email Address
                </FormLabel>
                <FormInput
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  error={errors.email}
                  required
                />
              </div>
            )}

            {contactMethod === 'sms' && features.smsEnabled && (
              <div className="mb-6">
                <FormLabel htmlFor="phoneNumber" required>
                  Phone Number
                </FormLabel>
                <FormInput
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  error={errors.phone}
                  required
                />
              </div>
            )}

            <div className="mb-6">
              <FormLabel htmlFor="painScore">
                Current Pain Level
              </FormLabel>
              
              {/* Premium Pain Severity Slider */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">No pain</span>
                  <span className="text-3xl font-bold text-[#0B5394]">{initialPainScore}</span>
                  <span className="text-sm text-gray-600">Severe pain</span>
                </div>
                
                <FormSlider
                  value={[initialPainScore]}
                  onValueChange={(value) => setInitialPainScore(value[0])}
                  min={0}
                  max={10}
                  step={1}
                />
                
                {/* Number indicators */}
                <div className="flex justify-between mt-2">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(num => (
                    <span 
                      key={num} 
                      className={`text-xs ${
                        initialPainScore === num 
                          ? 'text-[#0B5394] font-bold' 
                          : 'text-gray-400'
                      }`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
                
                {/* Pain level description */}
                <p className="text-sm text-center mt-3 text-gray-600">
                  {initialPainScore === 0 && "No pain"}
                  {initialPainScore >= 1 && initialPainScore <= 3 && "Mild pain"}
                  {initialPainScore >= 4 && initialPainScore <= 6 && "Moderate pain"}
                  {initialPainScore >= 7 && initialPainScore <= 9 && "Severe pain"}
                  {initialPainScore === 10 && "Worst possible pain"}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <FieldGroup>
                <FormCheckbox
                id="consent"
                checked={contactConsent}
                onCheckedChange={setContactConsent}
              >
                I agree to receive my personalized educational guide and optional 14-day progress tracker
              </FormCheckbox>
            </FieldGroup>
            {errors.consent && (
              <p className="text-red-500 text-sm mt-2">{errors.consent}</p>
            )}
          </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-8 py-3 bg-[#0B5394] text-white rounded-lg hover:bg-[#084074] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium shadow-sm flex items-center gap-2"
              >
                Get My Educational Guide
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
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
      </div>
    </div>
  );
};