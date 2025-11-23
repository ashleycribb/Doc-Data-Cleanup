import React, { useState } from 'react';

interface PasteDataProps {
  onPaste: (text: string) => void;
  disabled: boolean;
}

export const PasteData: React.FC<PasteDataProps> = ({ onPaste, disabled }) => {
    const [pastedText, setPastedText] = useState('');

    const handlePasteClick = () => {
        if (pastedText.trim()) {
            onPaste(pastedText);
        }
    };
    
    return (
        <div className="flex flex-col space-y-4">
            <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your raw data here (e.g., from a spreadsheet or text file)..."
                disabled={disabled}
                className="w-full h-40 p-4 bg-brand-gray-900 border border-brand-gray-700 rounded-md resize-y focus:ring-2 focus:ring-brand-blue focus:outline-none font-mono text-sm text-brand-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Paste data text area"
            />
            <button
                onClick={handlePasteClick}
                disabled={disabled || !pastedText.trim()}
                className="self-start px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue-light hover:bg-brand-blue disabled:bg-brand-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue focus:ring-offset-brand-gray-900 transition-colors"
            >
                Use Pasted Text
            </button>
        </div>
    );
};
