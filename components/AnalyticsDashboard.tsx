
import React from 'react';
import type { AnalyticsSummary } from '../src/services/analyticsService';
import { LineChartIcon } from './icons/LineChartIcon';
import { ResetIcon } from './icons/ResetIcon';

interface AnalyticsDashboardProps {
  summary: AnalyticsSummary | null;
  onReset: () => void;
}

const StatCard: React.FC<{ label: string, value: string | number, unit?: string }> = ({ label, value, unit }) => {
    return (
        <div className="bg-brand-gray-900/50 p-3 rounded-lg text-center border border-brand-gray-700">
            <p className="text-sm text-brand-gray-400">{label}</p>
            <p className="text-2xl font-bold text-brand-gray-100">
                {value}
                {unit && <span className="text-base ml-1 font-medium text-brand-gray-400">{unit}</span>}
            </p>
        </div>
    );
};

const DetailItem: React.FC<{ label: string, value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm py-1">
        <p className="text-brand-gray-400">{label}:</p>
        <p className="font-medium text-brand-gray-200">{value}</p>
    </div>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ summary, onReset }) => {
    if (!summary) {
        return null;
    }

    const formatTime = (ms: number) => {
        if (ms === 0) return '0s';
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const difficultyDistribution = Object.entries(summary.difficultyCounts)
        .map(([level, count]) => `${level}: ${count}`)
        .join(' / ');

    const dataSourceDistribution = Object.entries(summary.dataSourceCounts)
        .map(([source, count]) => `${source.charAt(0).toUpperCase() + source.slice(1)}: ${count}`)
        .join(' / ');

    return (
        <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col">
            <h2 className="text-xl font-semibold text-brand-gray-100 mb-4 flex items-center">
                <LineChartIcon className="w-6 h-6 mr-3 text-green-400" />
                6. Research Efficiency Metrics
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="Datasets Cleaned" value={summary.datasetsProcessed} />
                <StatCard label="Avg. Clean Time" value={formatTime(summary.averageProcessingTimeMs)} />
                <StatCard label="Chat Messages" value={summary.chatInteractions} />
                <StatCard label="Sessions" value={summary.totalSessions} />
                <StatCard label="Var. Changes" value={summary.variableChangesApplied} />
                <StatCard label="Insights Gen." value={summary.analysisSuggestionsGenerated} />
            </div>

            <div className="mt-6 border-t border-brand-gray-700 pt-4 space-y-2">
                <DetailItem label="Most Used Source" value={summary.mostUsedDataSource} />
                <DetailItem label="Source Breakdown" value={<span className="font-mono text-xs">{dataSourceDistribution}</span>} />
                <DetailItem label="Difficulty Breakdown" value={<span className="font-mono text-xs">{difficultyDistribution}</span>} />
            </div>

            <div className="mt-6 border-t border-brand-gray-700 pt-4">
                <button
                    onClick={onReset}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-brand-gray-600 text-sm font-medium rounded-md shadow-sm text-brand-gray-300 bg-brand-gray-700 hover:bg-red-900/50 hover:border-red-700 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-brand-gray-900 transition-colors"
                >
                    <ResetIcon className="w-4 h-4 mr-2" />
                    Reset All Metrics
                </button>
            </div>
        </div>
    );
};
