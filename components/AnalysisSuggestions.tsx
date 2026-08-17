
import React, { useState } from 'react';
import type { AnalysisSuggestion } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { OrangeIcon } from './icons/OrangeIcon';

interface AnalysisSuggestionsProps {
    onSuggest: () => void;
    suggestions: AnalysisSuggestion[];
    isLoading: boolean;
}

const SuggestionCard: React.FC<{ suggestion: AnalysisSuggestion }> = ({ suggestion }) => {
    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <div className="bg-brand-gray-900/70 p-4 rounded-lg border border-brand-gray-700 transition-all hover:border-brand-gray-600">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-brand-blue-light">{suggestion.name}</h3>
                <span className="text-xs font-medium bg-brand-gray-700 text-brand-gray-300 px-2 py-1 rounded-full">{suggestion.type}</span>
            </div>
            <p className="mt-2 text-sm text-brand-gray-300">{suggestion.description}</p>
            
            {suggestion.orangeInstructions && (
                <div className="mt-4 pt-3 border-t border-brand-gray-700/50">
                    <button 
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="flex items-center text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors focus:outline-none"
                    >
                        <OrangeIcon className="w-4 h-4 mr-1.5" />
                        {showInstructions ? 'Hide Orange Workflow' : 'Show Orange Workflow'}
                    </button>
                    
                    {showInstructions && (
                        <div className="mt-3 p-4 bg-brand-gray-800 rounded border border-brand-gray-700/50 animate-fade-in-up">
                            <p className="text-xs text-brand-gray-400 mb-3 font-semibold uppercase tracking-wider flex items-center">
                                <OrangeIcon className="w-4 h-4 mr-1.5 text-orange-500" />
                                Orange Analysis Workflow Guide
                            </p>

                            <div className="space-y-4">
                                {suggestion.stepByStepInstructions?.map((step, idx) => (
                                    <div key={idx} className="flex space-x-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gray-700 flex items-center justify-center text-[10px] font-bold text-brand-blue-light border border-brand-gray-600">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm text-brand-gray-300 leading-relaxed pt-0.5">{step}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-3 border-t border-brand-gray-700/30">
                                <p className="text-[10px] text-brand-gray-500 italic">
                                    Summary: {suggestion.orangeInstructions}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
             <style>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(5px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                  animation: fadeInUp 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export const AnalysisSuggestions: React.FC<AnalysisSuggestionsProps> = ({ onSuggest, suggestions, isLoading }) => {
    const hasSuggestions = suggestions.length > 0;

    return (
        <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col">
            <h2 className="text-xl font-semibold text-brand-gray-100 mb-4">4. Analysis &amp; Insights</h2>
            
            {!hasSuggestions && !isLoading && (
                 <div className="text-center py-4">
                    <p className="text-brand-gray-400 mb-4">Let Gemini suggest relevant statistical analyses for your cleaned data.</p>
                    <button
                        onClick={onSuggest}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-brand-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-brand-gray-900 transition-colors"
                    >
                         <LightbulbIcon className="w-5 h-5 mr-2" />
                        Suggest Analyses
                    </button>
                 </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center py-10">
                    <SpinnerIcon className="w-10 h-10 text-brand-blue-light" />
                    <p className="ml-4 text-brand-gray-300">Gemini is analyzing your data schema...</p>
                </div>
            )}

            {hasSuggestions && (
                <div className="space-y-4 mt-2">
                    {suggestions.map((suggestion, index) => (
                        <SuggestionCard key={index} suggestion={suggestion} />
                    ))}
                     <button
                        onClick={onSuggest}
                        disabled={isLoading}
                        className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 border border-brand-gray-600 text-sm font-medium rounded-md shadow-sm text-brand-gray-200 bg-brand-gray-700 hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-500 focus:ring-offset-brand-gray-900 transition-colors"
                    >
                         {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <LightbulbIcon className="w-5 h-5 mr-2" />}
                         {isLoading ? 'Regenerating...' : 'Regenerate Suggestions'}
                    </button>
                </div>
            )}
        </div>
    );
};
