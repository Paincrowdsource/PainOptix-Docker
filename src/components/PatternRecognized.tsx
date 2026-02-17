import React, { useEffect } from 'react';
import { ArrowRight, Lock, Shield, Sparkles, Activity, TrendingUp } from 'lucide-react';
import { EducationalGuide } from '@/types/algorithm';
import { getPatternInsights } from '@/lib/pattern-insights';
import { getDisplayName } from '@/lib/diagnosis-previews';

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
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B5394] to-[#084074] px-8 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight">Pattern Recognized</h2>
            <p className="text-blue-100 mt-2">Your responses match a clinically recognized mechanical pattern.</p>
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mt-3">
              {getDisplayName(guideType)}
            </span>
          </div>

          <div className="p-8 space-y-4">
            {/* Insight 1 */}
            <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
              <div className="w-10 h-10 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-[#0B5394]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0B5394] uppercase tracking-wide mb-1">What We Found</p>
                <p className="text-gray-800 leading-relaxed">{insights.insight1}</p>
              </div>
            </div>

            {/* Insight 2 */}
            <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
              <div className="w-10 h-10 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-[#0B5394]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0B5394] uppercase tracking-wide mb-1">What This Means</p>
                <p className="text-gray-800 leading-relaxed">{insights.insight2}</p>
              </div>
            </div>

            {/* Unlock CTA box */}
            <div className="rounded-xl border-2 border-[#0B5394]/20 bg-gradient-to-b from-gray-50 to-white p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0B5394]/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[#0B5394]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Unlock your personalized Recovery Tracker
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Get daily check-ins and a 14-day progress chart tailored to your pattern.
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
                className="px-8 py-3 bg-[#0B5394] text-white rounded-xl hover:bg-[#084074] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium shadow-sm flex items-center gap-2"
              >
                Start 14-Day Tracker
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Trust indicators - inline */}
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
