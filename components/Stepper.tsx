import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} flex-1`}>
            {currentStep > stepIdx + 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div
                  onClick={() => onStepClick && onStepClick(stepIdx + 1)}
                  className={`relative flex h-8 w-8 items-center justify-center bg-primary rounded-full ${onStepClick ? 'cursor-pointer hover:bg-primary/80' : ''}`}
                >
                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                  </svg>
                  <span className="absolute -bottom-6 w-max text-xs text-center text-white font-semibold">{step}</span>
                </div>
              </>
            ) : currentStep === stepIdx + 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-white/10" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-white/5 backdrop-blur-xl border-2 border-primary rounded-full" aria-current="step">
                  <span className="h-2.5 w-2.5 bg-primary rounded-full" aria-hidden="true" />
                  <span className="absolute -bottom-6 w-max text-xs text-center text-primary font-semibold">{step}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-white/10" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-full">
                  <span className="h-2.5 w-2.5 bg-transparent rounded-full" aria-hidden="true" />
                  <span className="absolute -bottom-6 w-max text-xs text-center text-slate-400 font-medium">{step}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};