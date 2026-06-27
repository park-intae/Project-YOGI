'use client';

import { useState, useEffect } from 'react';

const ALL_STEPS = [
  { id: 'step-form', label: '정보 입력' },
  { id: 'step-recommendation', label: 'AI 추천 요금제' },
  { id: 'step-compare', label: '추가 요금제 비교' },
];

export default function VerticalStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<typeof ALL_STEPS>([]);

  useEffect(() => {
    const updateVisibleSteps = () => {
      const currentVisible = ALL_STEPS.filter(step => document.getElementById(step.id) !== null);
      // Only update if the length or IDs actually changed to prevent infinite re-renders
      setVisibleSteps(prev => {
        const isSame = prev.length === currentVisible.length && prev.every((p, i) => p.id === currentVisible[i].id);
        return isSame ? prev : currentVisible;
      });
    };

    updateVisibleSteps(); // Initial check

    // Observe DOM changes to detect when new sections are rendered
    const observer = new MutationObserver(() => {
      updateVisibleSteps();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      let currentStepIndex = 0;
      ALL_STEPS.forEach((step) => {
        const element = document.getElementById(step.id);
        if (element) {
          const { top } = element.getBoundingClientRect();
          const elementTop = top + window.scrollY;
          if (scrollPosition >= elementTop) {
            // Find the index of this step in the visibleSteps array
            const visibleIndex = ALL_STEPS.filter(s => document.getElementById(s.id)).findIndex(s => s.id === step.id);
            if (visibleIndex !== -1) {
              currentStepIndex = visibleIndex;
            }
          }
        }
      });
      setActiveStep(currentStepIndex);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToStep = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100, // Offset for header
        behavior: 'smooth',
      });
    }
  };

  if (visibleSteps.length <= 1) return null; // Hide stepper if there's only 1 step (e.g. initial form state)

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center">
      <div className="bg-white dark:bg-slate-900 rounded-full shadow-lg border border-gray-100 dark:border-slate-800 p-4 flex flex-col items-center space-y-6">
        {visibleSteps.map((step, index) => {
          const isActive = index <= activeStep;
          const isCurrent = index === activeStep;
          return (
            <div key={step.id} className="relative flex flex-col items-center group cursor-pointer" onClick={() => scrollToStep(step.id)}>
              {/* Step indicator */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 
                  ${isCurrent ? 'bg-blue-600 text-white shadow-md scale-110' : isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700'}
                `}
              >
                {index + 1}
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {step.label}
              </div>

              {/* Connecting line */}
              {index < visibleSteps.length - 1 && (
                <div className="absolute top-10 w-[2px] h-12 bg-gray-200 dark:bg-slate-700 -z-0">
                  <div 
                    className="w-full bg-blue-600 transition-all duration-500 ease-in-out" 
                    style={{ height: isActive && activeStep > index ? '100%' : '0%' }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
