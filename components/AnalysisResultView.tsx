import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, Label, LabelList, LineChart, Line } from 'recharts';
import type { AnalysisResult, StatisticsResult, CorrelationResult, SentimentResult, FrequencyResult, TopicsResult, TrendResult, AnomalyResult } from '../types';
import { BarChartIcon } from './icons/BarChartIcon';
import { LinkIcon } from './icons/LinkIcon';
import { SmileyIcon } from './icons/SmileyIcon';
import { TopicIcon } from './icons/TopicIcon';
import { LineChartIcon } from './icons/LineChartIcon';
import { AlertIcon } from './icons/AlertIcon';

interface AnalysisResultViewProps {
  result: AnalysisResult;
}

const StatCard: React.FC<{ label: string, value: string | number | undefined }> = ({ label, value }) => {
    if (value === undefined || value === null) return null;
    const displayValue = typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
    return (
        <div className="bg-brand-gray-800/60 p-2 rounded-md text-center">
            <p className="text-xs text-brand-gray-400">{label}</p>
            <p className="text-sm font-bold text-brand-gray-100">{displayValue}</p>
        </div>
    );
};

const StatisticsView: React.FC<{ result: StatisticsResult }> = ({ result }) => (
    <div>
        <h4 className="flex items-center text-sm font-semibold text-brand-gray-200 mb-2">
            <BarChartIcon className="w-4 h-4 mr-2" />
            Descriptive Statistics for '{result.targetColumn}'
        </h4>
        <div className="grid grid-cols-3 gap-2">
            <StatCard label="Count" value={result.metrics.count} />
            <StatCard label="Mean" value={result.metrics.mean} />
            <StatCard label="Median" value={result.metrics.median} />
            <StatCard label="Min" value={result.metrics.min} />
            <StatCard label="Max" value={result.metrics.max} />
            <StatCard label="Std Dev" value={result.metrics.stdDev} />
        </div>
    </div>
);

const CorrelationView: React.FC<{ result: CorrelationResult }> = ({ result }) => (
     <div>
        <h4 className="flex items-center text-sm font-semibold text-brand-gray-200 mb-2">
            <LinkIcon className="w-4 h-4 mr-2" />
            Top Correlations
        </h4>
        <ul className="space-y-1 text-xs">
            {result.correlations.map((corr, index) => (
                <li key={index} className="flex justify-between p-1.5 rounded bg-brand-gray-800/60">
                    <span className="font-mono text-brand-gray-300">{corr.column1} &harr; {corr.column2}</span>
                    <span className={`font-bold ${corr.correlation > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {corr.correlation.toFixed(3)}
                    </span>
                </li>
            ))}
        </ul>
    </div>
);

const SentimentView: React.FC<{ result: SentimentResult }> = ({ result }) => {
    const data = [
        { name: 'Positive', value: result.positive, fill: '#22c55e' },
        { name: 'Neutral', value: result.neutral, fill: '#6b7280' },
        { name: 'Negative', value: result.negative, fill: '#ef4444' },
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
            <div className="bg-brand-gray-900/80 p-2 border border-brand-gray-600 rounded-md text-xs backdrop-blur-sm">
                <p className="text-brand-gray-200">{`${payload[0].name}: ${(payload[0].value * 100).toFixed(1)}%`}</p>
            </div>
            );
        }
        return null;
    };

    return (
        <div>
            <h4 className="flex items-center text-sm font-semibold text-brand-gray-200 mb-2">
                <SmileyIcon className="w-4 h-4 mr-2" />
                Sentiment for '{result.targetColumn}'
            </h4>
            <div className="w-full h-32">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px', color: '#d1d5db' }}
                            formatter={(value, entry) => <span className="text-brand-gray-300">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const FrequencyView: React.FC<{ result: FrequencyResult }> = ({ result }) => {
    // A histogram-style chart is better for a small number of categories.
    // A horizontal bar chart is more readable for a larger number of categories.
    const isHistogram = result.distribution.length <= 10;
    const chartData = isHistogram ? result.distribution : result.distribution.slice(0, 5);
    const title = isHistogram
        ? `Frequency Distribution for '${result.targetColumn}'`
        : `Top 5 Categories for '${result.targetColumn}'`;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
            <div className="bg-brand-gray-900/80 p-2 border border-brand-gray-600 rounded-md text-xs backdrop-blur-sm">
                <p className="font-bold text-brand-gray-200 mb-1">{label}</p>
                <p className="text-brand-blue-light">{`Count: ${payload[0].value.toLocaleString()}`}</p>
            </div>
            );
        }
        return null;
    };
    
    return (
        <div>
            <h4 className="flex items-center text-sm font-semibold text-brand-gray-200 mb-2">
                <BarChartIcon className="w-4 h-4 mr-2" />
                {title}
            </h4>
            <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                    {isHistogram ? (
                         <BarChart
                            data={chartData}
                            margin={{ top: 5, right: 20, left: 20, bottom: 15 }}
                        >
                            <XAxis
                                dataKey="category"
                                tick={{ fontSize: 9, fill: '#9ca3af' }}
                                interval={0}
                                angle={-25}
                                textAnchor="end"
                                height={30}
                            />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }}>
                                <Label value="Count" angle={-90} position="insideLeft" offset={-10} style={{ textAnchor: 'middle', fill: '#9ca3af', fontSize: '11px' }} />
                            </YAxis>
                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} content={<CustomTooltip />}/>
                            <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    ) : (
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 25, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="category"
                                width={120}
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                            />
                            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} content={<CustomTooltip />}/>
                            <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={12}>
                                <LabelList dataKey="count" position="right" style={{ fill: '#9ca3af', fontSize: '10px' }} formatter={(value: number) => value.toLocaleString()} />
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const TopicView: React.FC<{ result: TopicsResult }> = ({ result }) => (
    <div>
        <h4 className="flex items-center text-sm font-semibold text-brand-gray-200 mb-2">
            <TopicIcon className="w-4 h-4 mr-2" />
            Main Topics in '{result.targetColumn}'
        </h4>
        <div className="space-y-2">
            {result.topics.map((topic, index) => (
                <div key={index} className="text-xs p-1.5 rounded bg-brand-gray-800/60">
                    <p className="font-bold text-brand-gray-200">{topic.topic}</p>
                    <p className="text-brand-gray-400">
                        Keywords: <span className="font-mono">{topic.keywords.join(', ')}</span>
                    </p>
                </div>
            ))}
        </div>
    </div>
);

const TrendView: React.FC<{ result: TrendResult }> = ({ result }) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const value = typeof payload[0].value === 'number' ? payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : payload[0].value;
            return (
                <div className="bg-brand-gray-900/80 p-2 border border-brand-gray-600 rounded-md text-xs backdrop-blur-sm">
                    <p className="font-bold text-brand-gray-200 mb-1">{label}</p>
                    <p className="text-brand-blue-light">{`${result.targetColumn}: ${value}`}</p>
                </div>
            );
        }
        return null;
    };

    const trendColor = result.slope > 0 ? '#22c55e' : (result.slope < 0 ? '#ef4444' : '#9ca3af');

    return (
        <div>
            <h4 className="flex items-center text-sm font-semibold text-brand-gray-200 mb-2">
                <LineChartIcon className="w-4 h-4 mr-2" />
                Trend for '{result.targetColumn}' over '{result.timeColumn}'
            </h4>
            <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4b5563', strokeDasharray: '3 3' }} />
                        <Line type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2} dot={{ r: 2, fill: trendColor }} activeDot={{ r: 5 }} name={result.targetColumn} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-brand-gray-400 mt-2">{result.interpretation}</p>
        </div>
    );
};

const AnomalyView: React.FC<{ result: AnomalyResult }> = ({ result }) => {
    return (
        <div>
            <h4 className="flex items-center text-sm font-semibold text-brand-gray-200 mb-2">
                <AlertIcon className="w-4 h-4 mr-2" />
                Anomalies Detected in '{result.targetColumn}'
            </h4>
            {result.anomalies.length > 0 ? (
                <ul className="space-y-2 text-xs max-h-32 overflow-y-auto pr-2">
                    {result.anomalies.map((anomaly, index) => (
                        <li key={index} className="flex flex-col p-2 rounded bg-brand-gray-800/60">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-red-400">{String(anomaly.value)}</span>
                                {anomaly.rowIndex !== undefined && <span className="font-mono text-brand-gray-500">Row: {anomaly.rowIndex}</span>}
                            </div>
                            <p className="text-brand-gray-400">{anomaly.reason}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                 <p className="text-xs text-brand-gray-400">No significant anomalies were detected.</p>
            )}
        </div>
    );
};


export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result }) => {
  switch (result.analysisType) {
    case 'STATISTICS':
      return <StatisticsView result={result} />;
    case 'CORRELATION':
        return <CorrelationView result={result} />;
    case 'SENTIMENT':
        return <SentimentView result={result} />;
    case 'FREQUENCY':
        return <FrequencyView result={result} />;
    case 'TOPICS':
        return <TopicView result={result} />;
    case 'TREND':
        return <TrendView result={result as TrendResult} />;
    case 'ANOMALY_DETECTION':
        return <AnomalyView result={result as AnomalyResult} />;
    default:
      return <p className="text-xs text-red-400">Unknown analysis result type.</p>;
  }
};