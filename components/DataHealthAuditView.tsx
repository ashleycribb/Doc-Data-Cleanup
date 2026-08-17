
import React from 'react';
import { DataHealthScore } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertIcon } from './icons/AlertIcon';
import { InfoIcon } from './icons/InfoIcon';

interface DataHealthAuditViewProps {
  score: DataHealthScore | null;
}

export const DataHealthAuditView: React.FC<DataHealthAuditViewProps> = ({ score }) => {
  if (!score) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'None': return 'text-green-400';
      case 'Low': return 'text-yellow-400';
      case 'Medium': return 'text-orange-400';
      case 'High': return 'text-red-400';
      default: return 'text-brand-gray-400';
    }
  };

  const MetricBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-brand-gray-400">{label}</span>
        <span className="text-brand-gray-200">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 w-full bg-brand-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-blue-light transition-all duration-1000 ease-out"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-brand-gray-800/40 border border-brand-gray-700 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gray-400 flex items-center">
          <InfoIcon className="w-4 h-4 mr-2" />
          AI Data Health Audit
        </h3>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${score.overallScore > 70 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
          SCORE: {score.overallScore}/100
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <MetricBar label="Completeness" value={score.completeness} />
          <MetricBar label="Accuracy (Est.)" value={score.accuracy} />
          <MetricBar label="Consistency" value={score.consistency} />
        </div>

        <div className="flex flex-col justify-center space-y-4">
          <div className="flex items-center space-x-3 bg-brand-gray-900/40 p-3 rounded-lg border border-brand-gray-700">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-brand-gray-800 flex items-center justify-center`}>
              {score.piiRisk === 'None' ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <AlertIcon className={`w-5 h-5 ${getRiskColor(score.piiRisk)}`} />}
            </div>
            <div>
              <p className="text-xs text-brand-gray-400">PII Sensitivity</p>
              <p className={`text-sm font-bold ${getRiskColor(score.piiRisk)}`}>{score.piiRisk} Risk Detected</p>
            </div>
          </div>

          <p className="text-[10px] text-brand-gray-500 italic leading-tight">
            * This audit is generated using LLM heuristics based on a sample of your data.
          </p>
        </div>
      </div>
    </div>
  );
};
