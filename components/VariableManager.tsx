
import React, { useState, useEffect } from 'react';
import type { VariableSuggestion } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { WandIcon } from './icons/WandIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface VariableManagerProps {
    onSuggest: () => void;
    onApply: (suggestions: VariableSuggestion[]) => void;
    suggestions: VariableSuggestion[];
    isSuggesting: boolean;
    isApplying: boolean;
    hasOptimized?: boolean;
}

const SuggestionTypeBadge: React.FC<{ type: VariableSuggestion['suggestionType'] }> = ({ type }) => {
    const typeMap = {
        'RENAME': 'bg-blue-600/50 text-blue-300 border-blue-500/60',
        'CHANGE_TYPE': 'bg-purple-600/50 text-purple-300 border-purple-500/60',
        'REMOVE_COLUMN': 'bg-red-600/50 text-red-300 border-red-500/60',
    };
    const classes = typeMap[type] || 'bg-gray-600/50 text-gray-300 border-gray-500/60';
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${classes}`}>{type.replace('_', ' ')}</span>;
};

export const VariableManager: React.FC<VariableManagerProps> = ({ onSuggest, onApply, suggestions, isSuggesting, isApplying, hasOptimized = false }) => {
    const hasSuggestions = suggestions.length > 0;
    const [checkedState, setCheckedState] = useState<boolean[]>([]);

    useEffect(() => {
        // Initialize checked state when suggestions are loaded
        setCheckedState(new Array(suggestions.length).fill(true));
    }, [suggestions]);

    const handleCheckboxChange = (position: number) => {
        const updatedCheckedState = checkedState.map((item, index) =>
            index === position ? !item : item
        );
        setCheckedState(updatedCheckedState);
    };

    const handleApplyClick = () => {
        const selectedSuggestions = suggestions.filter((_, index) => checkedState[index]);
        onApply(selectedSuggestions);
    };

    const isLoading = isSuggesting || isApplying;

    return (
        <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col">
            <h2 className="text-xl font-semibold text-brand-gray-100 mb-4">3. Optimize Variables</h2>

            {!hasSuggestions && !isSuggesting && (
                <div className="text-center py-4">
                     {hasOptimized && (
                        <div className="mb-4 p-2 bg-green-900/30 border border-green-700/50 rounded-md flex items-center justify-center text-green-300 text-sm animate-fade-in-up">
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Variables have been optimized successfully.
                        </div>
                    )}
                    <p className="text-brand-gray-400 mb-4">Let Gemini suggest ways to optimize your data's columns for analysis.</p>
                    <button
                        onClick={onSuggest}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-brand-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-brand-gray-900 transition-colors"
                    >
                         <WandIcon className="w-5 h-5 mr-2" />
                        Suggest Optimizations
                    </button>
                </div>
            )}

            {isSuggesting && (
                <div className="flex items-center justify-center py-10">
                    <SpinnerIcon className="w-10 h-10 text-purple-400" />
                    <p className="ml-4 text-brand-gray-300">Gemini is inspecting your variables...</p>
                </div>
            )}

            {hasSuggestions && (
                <div className="space-y-4 mt-2">
                    <p className="text-sm text-brand-gray-300">Gemini has the following suggestions. Uncheck any you don't want to apply.</p>
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="bg-brand-gray-900/70 p-4 rounded-lg border border-brand-gray-700 flex items-start space-x-4">
                            <input
                                type="checkbox"
                                id={`suggestion-${index}`}
                                checked={checkedState[index] ?? true}
                                onChange={() => handleCheckboxChange(index)}
                                className="mt-1 h-5 w-5 rounded bg-brand-gray-700 border-brand-gray-600 text-purple-500 focus:ring-purple-600 focus:ring-offset-brand-gray-900"
                            />
                            <div className="flex-1">
                                <label htmlFor={`suggestion-${index}`} className="flex items-center justify-between cursor-pointer">
                                    <h3 className="font-semibold text-base text-purple-300">
                                        <span className="font-mono bg-brand-gray-800 px-1.5 py-0.5 rounded mr-2 text-purple-200">{suggestion.columnName}</span>
                                    </h3>
                                    <SuggestionTypeBadge type={suggestion.suggestionType} />
                                </label>
                                <p className="mt-1 text-sm text-brand-gray-300">{suggestion.description}</p>
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-brand-gray-700">
                        <button
                            onClick={handleApplyClick}
                            disabled={isLoading || checkedState.every(c => !c)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-brand-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-brand-gray-900 transition-colors"
                        >
                            {isApplying ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                            {isApplying ? 'Applying...' : 'Apply Changes'}
                        </button>
                        <button
                            onClick={() => onSuggest()} // Re-fetch suggestions
                            disabled={isLoading}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-brand-gray-600 text-sm font-medium rounded-md shadow-sm text-brand-gray-200 bg-brand-gray-700 hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-500 focus:ring-offset-brand-gray-900 transition-colors"
                        >
                             <WandIcon className="w-5 h-5 mr-2" />
                             Regenerate
                        </button>
                    </div>
                </div>
            )}
             <style>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(5px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                  animation: fadeInUp 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
