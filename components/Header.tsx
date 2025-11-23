

import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { HelpIcon } from './icons/HelpIcon';
import { InfoIcon } from './icons/InfoIcon';

interface HeaderProps {
    onHelpClick: () => void;
    onAboutClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHelpClick, onAboutClick }) => {
    return (
        <header className="relative text-center">
            <div className="flex items-center justify-center gap-4">
                <LogoIcon className="w-12 h-12 text-brand-blue-light"/>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-brand-gray-50">
                    Doc Data Cleanup Agent
                </h1>
            </div>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-brand-gray-400">
                Upload your raw data, and let our Gemini-powered agent inspect, standardize, and clean it for you in seconds.
            </p>
            <div className="absolute top-0 right-0 flex space-x-2">
                <button 
                    onClick={onHelpClick}
                    className="p-2 text-brand-gray-400 hover:text-white hover:bg-brand-gray-700 rounded-full transition-colors"
                    aria-label="Help"
                >
                    <HelpIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={onAboutClick}
                    className="p-2 text-brand-gray-400 hover:text-white hover:bg-brand-gray-700 rounded-full transition-colors"
                    aria-label="About"
                >
                    <InfoIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};
