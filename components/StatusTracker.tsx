
import React, { useState, useEffect } from 'react';
import type { ProcessStep } from '../types';
import { ProcessStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DotIcon } from './icons/DotIcon';
import { ProgressBar } from './ProgressBar';

interface StatusTrackerProps {
  steps: ProcessStep[];
  progress: number;
  isLoading: boolean;
}

const getStatusIcon = (status: ProcessStatus) => {
  switch (status) {
    case ProcessStatus.COMPLETED:
      return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
    case ProcessStatus.IN_PROGRESS:
      return <SpinnerIcon className="w-6 h-6 text-blue-400" />;
    case ProcessStatus.FAILED:
      return <XCircleIcon className="w-6 h-6 text-red-400" />;
    case ProcessStatus.PENDING:
    default:
      return <DotIcon className="w-6 h-6 text-brand-gray-500" />;
  }
};

/**
 * A small component to render text with an animated ellipsis,
 * indicating an ongoing process.
 */
const InProgressDetails: React.FC<{ text: string }> = ({ text }) => {
  const [ellipsis, setEllipsis] = useState('.');

  useEffect(() => {
    const timer = setInterval(() => {
      setEllipsis(prev => (prev.length < 3 ? prev + '.' : '.'));
    }, 400);

    return () => clearInterval(timer);
  }, []);

  return <p className="text-sm font-medium text-blue-300">{text}{ellipsis}</p>;
};


export const StatusTracker: React.FC<StatusTrackerProps> = ({ steps, progress, isLoading }) => {
  return (
    <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-brand-gray-100 mb-5">2. Agent Status</h2>
      {isLoading && <ProgressBar progress={progress} />}
      <ol className="relative border-l border-brand-gray-700 ml-3">
        {steps.map((step, index) => (
          <li key={index} className="mb-8 ml-6 last:mb-0">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-brand-gray-800 rounded-full -left-3 ring-4 ring-brand-gray-800">
              {getStatusIcon(step.status)}
            </span>
            <div className="ml-2">
                <h3 className={`font-semibold ${step.status !== ProcessStatus.PENDING ? 'text-brand-gray-100' : 'text-brand-gray-500'}`}>{step.name}</h3>
                {step.status === ProcessStatus.IN_PROGRESS && step.details ? (
                  <InProgressDetails text={step.details.replace(/\.*$/, '')} />
                ) : (
                  <p className="text-sm text-brand-gray-400">{step.details}</p>
                )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
