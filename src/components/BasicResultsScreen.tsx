import React from 'react';
import Image from 'next/image';
import { EducationalGuide } from '@/types/algorithm';
import { getDiagnosisPreview } from '@/lib/diagnosis-previews';
import { CheckCircle, AlertTriangle, ChevronRight, Shield, Lock, Award, Activity } from 'lucide-react';

interface BasicResultsScreenProps {
  diagnosis: EducationalGuide;
  onContinue: () => void;
}

export const BasicResultsScreen: React.FC<BasicResultsScreenProps> = ({ diagnosis, onContinue }) => {
  const preview = getDiagnosisPreview(diagnosis);
  const isUrgent = diagnosis === 'urgent_symptoms';

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white -m-8">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.01]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230B5394' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4">
        {/* Logo */}
        <div className="pt-4 pb-3 text-center">
          <Image
            src="/branding/painoptix-logo.png"
            alt="PainOptix"
            width={190}
            height={60}
            className="mx-auto"
            priority
          />
        </div>

        {/* Progress Indicator */}
        <div className="pb-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-medium">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm text-gray-600">Assessment Complete</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${isUrgent ? 'bg-orange-500' : 'bg-[#0B5394]'} text-white flex items-center justify-center text-sm font-medium`}>
                  2
                </div>
                <span className="text-sm font-medium text-gray-900">Your Results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with gradient - Different color for urgent */}
          <div className={`${isUrgent ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gradient-to-r from-[#0B5394] to-[#084074]'} px-8 py-5 text-center`}>
            <p className="text-white text-lg">
              {isUrgent
                ? "Your responses indicate symptoms that require immediate medical attention."
                : "Based on your responses, we've identified your pain pattern and immediate relief strategies."}
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Diagnosis Name */}
            <div className="text-center pb-6 border-b border-gray-100">
              <div className={`inline-block px-6 py-3 rounded-full ${isUrgent ? 'bg-orange-50 text-orange-900' : 'bg-blue-50 text-[#0B5394]'} mb-4`}>
                <span className="text-sm font-medium uppercase tracking-wide">Identified Pattern</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {preview.displayName}
              </h3>
              {isUrgent && (
                <p className="text-red-600 font-medium">
                  Please seek medical attention as soon as possible
                </p>
              )}
            </div>

            {/* Symptoms Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${isUrgent ? 'text-orange-500' : 'text-emerald-500'}`} />
                Based on your responses:
              </h4>
              <div className="space-y-3">
                {preview.symptoms.map((symptom, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full ${isUrgent ? 'bg-orange-100' : 'bg-emerald-100'} flex items-center justify-center mt-0.5`}>
                      <CheckCircle className={`w-4 h-4 ${isUrgent ? 'text-orange-600' : 'text-emerald-600'}`} />
                    </div>
                    <p className="text-gray-700 leading-relaxed">{symptom}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className={`w-5 h-5 ${isUrgent ? 'text-orange-500' : 'text-[#0B5394]'}`} />
                {isUrgent ? "Immediate actions:" : "What you can try today:"}
              </h4>
              <div className="space-y-3">
                {preview.tips.map((tip, index) => (
                  <div key={index} className={`flex items-start gap-3 p-4 rounded-lg ${isUrgent ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isUrgent ? 'bg-orange-500' : 'bg-[#0B5394]'} text-white flex items-center justify-center font-semibold text-sm mt-0.5`}>
                      {index + 1}
                    </div>
                    <p className="text-gray-800 leading-relaxed font-medium">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Proposition */}
            <div className={`p-6 rounded-xl ${isUrgent ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200'}`}>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                {isUrgent
                  ? "Get Emergency Guidance & Resources"
                  : "Want Your Complete Recovery Guide?"}
              </h4>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {isUrgent
                  ? "Receive detailed emergency guidance, questions to ask your doctor, and what to expect during urgent evaluation."
                  : "Get your personalized educational guide with detailed explanations, exercises, and a 14-day progress tracker to monitor your recovery."}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{isUrgent ? "Emergency protocols" : "Evidence-based strategies"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{isUrgent ? "Doctor questions" : "Exercise guidance"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{isUrgent ? "What to expect" : "Progress tracking"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{isUrgent ? "Next steps" : "Follow-up support"}</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onContinue}
              className={`w-full px-8 py-4 ${isUrgent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#0B5394] hover:bg-[#084074]'} text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-semibold shadow-lg flex items-center justify-center gap-2 text-lg`}
            >
              {isUrgent ? "Get Emergency Guidance" : "Get My Complete Guide"}
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Privacy Note */}
            <p className="text-center text-sm text-gray-500">
              We&apos;ll send your personalized guide to your email or phone. Your information is secure and HIPAA compliant.
            </p>
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

        {/* Additional Note for Non-Urgent */}
        {!isUrgent && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Not ready yet? That&apos;s okay. You can always complete this assessment again later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};