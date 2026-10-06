/**
 * StepIndicator — visual progress tracker for the multi-step form wizard.
 *
 * Renders a horizontal sequence of numbered circles connected by lines.
 * The current step is highlighted with the brand color (#5B21B6 / purple-700).
 * Completed steps show a filled circle; upcoming steps are outlined.
 *
 * Requirements: 4, 6
 */

interface StepIndicatorProps {
  /** Ordered list of step labels, e.g. ["Person", "Staff", "CDL Student"] */
  steps: string[];
  /** Zero-based index of the active step */
  currentStepIndex: number;
}

/**
 * StepIndicator
 *
 * @param steps            - Array of step label strings
 * @param currentStepIndex - Zero-based index of the currently active step
 */
export default function StepIndicator({ steps, currentStepIndex }: StepIndicatorProps) {
  if (steps.length === 0) return null;

  return (
    <nav aria-label="Form progress" className="w-full">
      <ol className="flex items-center">
        {steps.map((label, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className={['flex items-center', isLast ? '' : 'flex-1'].join(' ')}
            >
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1">
                {/* Numbered circle */}
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    isCompleted
                      ? 'bg-purple-700 text-white'
                      : isCurrent
                      ? 'border-2 border-purple-700 bg-white text-purple-700'
                      : 'border-2 border-gray-300 bg-white text-gray-400',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    /* Checkmark for completed steps */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={[
                    'max-w-[6rem] text-center text-xs leading-tight',
                    isCurrent
                      ? 'font-semibold text-purple-700'
                      : isCompleted
                      ? 'text-purple-600'
                      : 'text-gray-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={[
                    'mx-2 h-0.5 flex-1 transition-colors',
                    isCompleted ? 'bg-purple-700' : 'bg-gray-300',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
