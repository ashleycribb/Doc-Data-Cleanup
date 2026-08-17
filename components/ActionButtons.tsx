
import React from 'react';
import { CleanIcon } from './icons/CleanIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ResetIcon } from './icons/ResetIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { OrangeIcon } from './icons/OrangeIcon';

interface ActionButtonsProps {
  isReadyToClean: boolean;
  isCleaning: boolean;
  isDone: boolean;
  onStart: () => void;
  onDownload: () => void;
  onDownloadOrange: () => void;
  onReset: () => void;
  hasOptimized?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isReadyToClean,
  isCleaning,
  isDone,
  onStart,
  onDownload,
  onDownloadOrange,
  onReset,
  hasOptimized = false,
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        {isDone ? (
          <>
            <button
              onClick={onDownload}
              className={`flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray-900 transition-colors ${
                  hasOptimized
                  ? 'bg-green-700 hover:bg-green-800 focus:ring-green-600'
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {hasOptimized ? (
                  <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Download Optimized Data
                  </>
              ) : (
                  <>
                      <DownloadIcon className="w-5 h-5 mr-2" />
                      Download Cleaned CSV
                  </>
              )}
            </button>
            <button
              onClick={onDownloadOrange}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-brand-gray-900 transition-colors"
            >
              <OrangeIcon className="w-5 h-5 mr-2" />
              Export for Orange (.tab)
            </button>
          </>
        ) : (
          <button
            onClick={onStart}
            disabled={!isReadyToClean || isCleaning}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-blue-light hover:bg-brand-blue disabled:bg-brand-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue focus:ring-offset-brand-gray-900 transition-colors"
          >
            {isCleaning ? (
              <SpinnerIcon className="w-5 h-5 mr-2" />
            ) : (
              <CleanIcon className="w-5 h-5 mr-2" />
            )}
            {isCleaning ? 'Cleaning in Progress...' : 'Start Cleanup'}
          </button>
        )}
      </div>

      {isDone && (
        <button
          onClick={onReset}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-brand-gray-600 text-base font-medium rounded-md shadow-sm text-brand-gray-200 bg-brand-gray-700 hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-500 focus:ring-offset-brand-gray-900 transition-colors"
        >
          <ResetIcon className="w-5 h-5 mr-2" />
          Start Over / New Dataset
        </button>
      )}
    </div>
  );
};
