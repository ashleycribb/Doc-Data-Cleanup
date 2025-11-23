import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { PasteData } from './PasteData';
import { GoogleDriveInput } from './GoogleDriveInput';
import { UploadIcon } from './icons/UploadIcon';
import { PasteIcon } from './icons/PasteIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';

type InputSource = 'upload' | 'paste' | 'drive';

interface DataSourceSelectorProps {
  onFileChange: (file: File | null) => void;
  onPaste: (text: string) => void;
  onDriveSelect: (data: string, fileName: string) => void;
  disabled: boolean;
  file: File | null;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({ onFileChange, onPaste, onDriveSelect, disabled, file }) => {
  const [activeSource, setActiveSource] = useState<InputSource>('upload');

  const tabs: { id: InputSource; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'upload', name: 'Upload File', icon: UploadIcon },
    { id: 'paste', name: 'Paste Text', icon: PasteIcon },
    { id: 'drive', name: 'Google Drive', icon: GoogleDriveIcon },
  ];

  const renderContent = () => {
    switch (activeSource) {
      case 'upload':
        return <FileUpload onFileChange={onFileChange} disabled={disabled} file={file} />;
      case 'paste':
        return <PasteData onPaste={onPaste} disabled={disabled} />;
      case 'drive':
        return <GoogleDriveInput onDriveSelect={onDriveSelect} disabled={disabled} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-brand-gray-100 mb-4">1. Provide Your Data</h2>
      <div className="border-b border-brand-gray-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSource(tab.id)}
              disabled={disabled}
              className={`
                ${activeSource === tab.id
                  ? 'border-brand-blue-light text-brand-blue-light'
                  : 'border-transparent text-brand-gray-400 hover:text-brand-gray-200 hover:border-brand-gray-500'
                }
                group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-current={activeSource === tab.id ? 'page' : undefined}
            >
              <tab.icon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};
