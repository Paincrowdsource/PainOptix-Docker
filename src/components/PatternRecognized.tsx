import React, { useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Lock,
  Shield,
  Sparkles,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { buildSymptomSummary } from '@/lib/symptom-summary';

interface PatternRecognizedProps {
  responses: Map<string, any>;
  isUrgent: boolean;
  onContinue: () => void;
  onBack: () => void;
  onViewed?: () => void;
}

export const PatternRecognized: React.FC<PatternRecognizedProps> = ({
  responses,
  isUrgent,
  onContinue,
  onBack,
  onViewed,
}) => {
  const symptoms = useMemo(() => buildSymptomSummary(responses), [responses]);

  useEffect(() => {
    onViewed?.();
  }, [onViewed]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white -m-8 p-8">
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div
            className={`px-8 py-8 text-center ${
              isUrgent
                ? 'bg-gradient-to-r from-orange-600 to-red-700'
                : 'bg-gradient-to-r from-[#0B5394] to-[#084074]'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              {isUrgent ? (
                <AlertTriangle className="w-8 h-8 text-white" />
              ) : (
                <Sparkles className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight">
              {isUrgent ? 'Important Finding' : 'Pattern Recognized'}
            </h2>
            <p className={`mt-2 ${isUrgent ? 'text-orange-100' : 'text-blue-100'}`}>
              {isUrgent
                ? 'Your responses indicate symptoms that warrant prompt medical attention.'
                : 'Your responses match a clinically recognized condition.'}
            </p>
          </div>

          <div className="p-8 space-y-4">
            {/* Urgent safety banner */}
            {isUrgent && (
              <div className="flex items-start gap-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-5">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">
                    Please seek medical attention soon
                  </p>
                  <p className="text-orange-800 text-sm mt-1 leading-relaxed">
                    Based on your responses, we recommend you contact your doctor or visit an
                    urgent care facility. Your personalized guide includes the right questions to
                    ask your provider.
                  </p>
                </div>
              </div>
            )}

            {/* What You Reported — symptom echo-back */}
            <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
              <div className="w-10 h-10 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5 text-[#0B5394]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0B5394] uppercase tracking-wide mb-2">
                  What You Reported
                </p>
                {symptoms.length > 0 ? (
                  <ul className="space-y-1.5">
                    {symptoms.map((symptom, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-800">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-snug">{symptom}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    Based on the symptoms you described, we&apos;ve identified a recognizable
                    clinical pattern.
                  </p>
                )}
              </div>
            </div>

            {/* What This Means — generic, no condition hint */}
            <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
              <div className="w-10 h-10 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-[#0B5394]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0B5394] uppercase tracking-wide mb-1">
                  What This Means
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {isUrgent
                    ? 'Some of your responses suggest symptoms that a medical professional should evaluate. We\u2019ve prepared a detailed guide with the specific questions to bring to your doctor.'
                    : 'This combination of symptoms matches a well-documented clinical pattern. Your personalized guide \u2014 including your specific condition name, what it means, and a recovery plan \u2014 is ready to send to you.'}
                </p>
              </div>
            </div>

            {/* Unlock CTA box */}
            <div className="rounded-xl border-2 border-[#0B5394]/20 bg-gradient-to-b from-gray-50 to-white p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[#0B5394]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {isUrgent
                    ? 'Get your personalized guide with questions for your doctor'
                    : 'Unlock your diagnosis and personalized recovery guide'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isUrgent
                    ? 'Includes your specific condition details, what to discuss with your provider, and a 14-day recovery tracker.'
                    : 'Get your specific condition name, what it means, and evidence-based recovery strategies \u2014 sent to your phone for free.'}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onContinue}
                className={`px-8 py-3 text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium shadow-sm flex items-center gap-2 ${
                  isUrgent
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-[#0B5394] hover:bg-[#084074]'
                }`}
              >
                {isUrgent ? 'Get My Free Guide' : 'Get My Free Diagnosis'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

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
