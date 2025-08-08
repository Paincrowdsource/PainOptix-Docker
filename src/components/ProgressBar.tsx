import React from 'react';
import * as Progress from '@radix-ui/react-progress';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  showApproximate?: boolean;
}

export default function ProgressBar({ currentStep, totalSteps, className = '', showApproximate = true }: ProgressBarProps) {
  // Ensure valid values to prevent runtime errors
  const validTotalSteps = Math.max(1, totalSteps || 1);
  const validCurrentStep = Math.max(1, Math.min(currentStep || 1, validTotalSteps));
  
  // Log for debugging if invalid values are passed
  if (!totalSteps || totalSteps < 1) {
    console.warn('ProgressBar: Invalid totalSteps value:', totalSteps);
  }
  
  // Calculate progress, handling edge case where totalSteps is 1
  const progressValue = validTotalSteps > 1 
    ? ((validCurrentStep - 1) / (validTotalSteps - 1)) * 100 
    : 100;
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <span className="text-sm font-medium text-gray-700">
          Step {validCurrentStep} of {showApproximate ? '~' : ''}{validTotalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progressValue)}% complete
        </span>
      </div>
      <Progress.Root
        className="relative overflow-hidden bg-gray-200 rounded-full w-full h-2 sm:h-3"
        value={progressValue}
        aria-label={`Assessment progress: ${Math.round(progressValue)}% complete`}
      >
        <Progress.Indicator
          className="bg-gradient-to-r from-blue-500 to-blue-600 w-full h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${100 - progressValue}%)` }}
        />
      </Progress.Root>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        {Array.from({ length: validTotalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index < validCurrentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
} 