import React from 'react';
import { Difficulty } from '../types';
import { AdjustmentsIcon } from './icons/AdjustmentsIcon';

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  disabled: boolean;
}

const difficultyOptions: { id: Difficulty; label: string; description: string }[] = [
  { id: Difficulty.EASY, label: 'Easy', description: 'Basic cleanup (e.g., trimming whitespace).' },
  { id: Difficulty.MEDIUM, label: 'Medium', description: 'Standard cleaning, formatting, and imputation.' },
  { id: Difficulty.HARD, label: 'Hard', description: 'Advanced cleaning with outlier and duplicate detection.' },
];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ selectedDifficulty, onDifficultyChange, disabled }) => {
  return (
    <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-brand-gray-100 mb-4 flex items-center">
        <AdjustmentsIcon className="w-6 h-6 mr-3 text-brand-gray-400" />
        Cleaning Difficulty
      </h2>
      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-4" disabled={disabled}>
        <legend className="sr-only">Select a cleaning difficulty</legend>
        {difficultyOptions.map((option) => (
          <div key={option.id}>
            <input
              type="radio"
              id={option.id}
              name="difficulty"
              value={option.id}
              checked={selectedDifficulty === option.id}
              onChange={() => onDifficultyChange(option.id)}
              className="sr-only"
            />
            <label
              htmlFor={option.id}
              className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                selectedDifficulty === option.id
                  ? 'bg-brand-blue/20 border-brand-blue-light'
                  : 'bg-brand-gray-800 border-brand-gray-700 hover:border-brand-gray-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="font-semibold text-brand-gray-100">{option.label}</span>
              <span className="text-sm text-brand-gray-400 mt-1">{option.description}</span>
            </label>
          </div>
        ))}
      </fieldset>
    </div>
  );
};
