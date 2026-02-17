import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle, Lock, Shield } from 'lucide-react';
import { EducationalGuide } from '@/types/algorithm';
import { getPatternInsights } from '@/lib/pattern-insights';

interface PatternRecognizedProps {
  guideType: EducationalGuide;
  onContinue: () => void;
  onBack: () => void;
  onViewed?: () => void;
}

export const PatternRecognized: React.FC<PatternRecognizedProps> = ({
  guideType,
  onContinue,
  onBack,
  onViewed,
}) => {
  const insights = getPatternInsights(guideType);

  useEffect(() => {
    onViewed?.();
  }, [onViewed]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white -m-8 p-8">
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0B5394] to-[#084074] px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-7 h-7 text-white" />
              <h2 className="text-2xl font-normal text-white">Pattern Recognized</h2>
            </div>
            <p className="text-blue-100">Your responses show a clinically recognized mechanical pattern.</p>
          </div>

          <div className="p-8 space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-gray-800">{insights.insight1}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-gray-800">{insights.insight2}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="font-medium text-gray-900">
                Unlock your personalized Monograph and 14-Day Recovery Tracker to see the full analysis.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="px-8 py-3 bg-[#0B5394] text-white rounded-lg hover:bg-[#084074] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium shadow-sm flex items-center gap-2"
              >
                Start 14-Day Tracker
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-2 gap-6 text-center">
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
          </div>
        </div>
      </div>
    </div>
  );
};
