'use client';

import { AssessmentWizard } from '@/src/components/AssessmentWizard';

export default function TestAssessmentPage() {
  const handleComplete = (guideType: string, sessionId: string) => {
    console.log('Assessment completed:', { guideType, sessionId });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-light)' }}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8" style={{ color: 'var(--text-primary)' }}>
          PainOptix™ Educational Assessment
        </h1>
        <AssessmentWizard onComplete={handleComplete} />
      </div>
    </div>
  );
}