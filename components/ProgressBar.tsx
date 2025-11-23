
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-brand-gray-200">Overall Progress</span>
        <span className="text-sm font-medium text-brand-gray-200">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-brand-gray-700 rounded-full h-2.5">
        <div
          className="bg-brand-blue-light h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        ></div>
      </div>
    </div>
  );
};
