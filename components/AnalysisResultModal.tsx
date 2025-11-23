
import React from 'react';
import type { AnalysisResult } from '../types';
import { Modal } from './Modal';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { AnalysisResultView } from './AnalysisResultView';

interface AnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  result: AnalysisResult | null;
  suggestionName: string;
}

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({ isOpen, onClose, isLoading, result, suggestionName }) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Result: ${suggestionName}`}>
      <div className="min-h-[250px] flex items-center justify-center p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center">
            <SpinnerIcon className="w-10 h-10 text-brand-blue-light" />
            <p className="mt-4 text-brand-gray-300">Gemini is performing the analysis...</p>
          </div>
        )}
        {!isLoading && result && (
          <div className="w-full">
            <AnalysisResultView result={result} />
          </div>
        )}
        {!isLoading && !result && (
            <p className="text-brand-gray-400">Analysis complete, but no result data was returned.</p>
        )}
      </div>
    </Modal>
  );
};
