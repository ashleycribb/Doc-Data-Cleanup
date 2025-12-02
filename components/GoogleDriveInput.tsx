
import React from 'react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';

interface GoogleDriveInputProps {
    onDriveSelect: (data: string, fileName: string) => void; // Kept for interface compatibility but now handled via parent
    onSelectClick?: () => void; // New prop for triggering the real picker
    disabled: boolean;
}

export const GoogleDriveInput: React.FC<GoogleDriveInputProps> = ({ onDriveSelect, onSelectClick, disabled }) => {
    
    // Fallback if the parent doesn't provide the real handler (e.g. during refactor)
    const handleClick = () => {
        if (onSelectClick) {
            onSelectClick();
        } else {
             // Basic fallback simulation if strictly necessary, though usually App.tsx passes the handler
             console.warn("No handler provided for Drive Selection");
        }
    };

    return (
        <div className="text-center py-8">
            <p className="text-brand-gray-400 mb-4">
                Connect to your Google Drive to select and import a file (CSV, Sheet, Excel) for cleaning.
            </p>
            <button
                onClick={handleClick}
                disabled={disabled}
                className="inline-flex items-center justify-center px-6 py-3 border border-brand-gray-600 text-base font-medium rounded-md shadow-sm text-brand-gray-200 bg-brand-gray-700 hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-500 focus:ring-offset-brand-gray-900 transition-colors disabled:opacity-50"
            >
                <GoogleDriveIcon className="w-5 h-5 mr-3" />
                Select from Google Drive
            </button>
        </div>
    );
};
