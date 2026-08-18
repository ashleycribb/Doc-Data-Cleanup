import React from 'react';
import { PreFlightIssue } from '../src/services/preFlightCheckService';
import { AlertIcon } from './icons/AlertIcon';
import { InfoIcon } from './icons/InfoIcon';

interface PreFlightCheckViewProps {
  issues: PreFlightIssue[];
}

export const PreFlightCheckView: React.FC<PreFlightCheckViewProps> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-800 p-4 rounded-lg mt-4 flex items-center">
        <InfoIcon className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
        <span className="text-green-300 text-sm">Pre-flight check passed: Data is ready for SPSS and Orange.</span>
      </div>
    );
  }

  return (
    <div className="bg-brand-gray-900/50 p-4 rounded-lg border border-orange-800 mt-4">
      <h3 className="font-semibold text-orange-400 mb-3 flex items-center">
        <AlertIcon className="w-5 h-5 mr-2 text-orange-400"/>
        Analysis Platform Pre-Flight Warnings
      </h3>
      <ul className="space-y-2">
        {issues.map((issue, idx) => (
          <li key={idx} className="flex items-start text-sm">
            <span className={`mr-2 mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${issue.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-brand-gray-300">
              <strong className="text-brand-gray-200">[{issue.platform}]</strong> {issue.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
