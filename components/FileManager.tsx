
import React from 'react';
import { FileIcon } from './icons/FileIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { InfoIcon } from './icons/InfoIcon';

interface FileManagerProps {
  originalFile: File | null;
  originalData: string;
  cleanedData: string;
  cleaningSummary: string[];
  onSaveToDrive: () => void;
  isSavingToDrive: boolean;
  driveFeedback: { message: string; type: 'success' | 'info' } | null;
}

const getStats = (data: string) => {
    if (!data) return { rows: 0, cols: 0 };
    // Filter out empty lines which might result from trailing newlines
    const lines = data.split('\n').filter(line => line.trim() !== '');
    // The number of rows is the number of non-empty lines, minus 1 for the header
    const rows = lines.length > 0 ? lines.length -1 : 0;
    const cols = lines[0]?.split(',').length || 0;
    return { rows: rows < 0 ? 0 : rows, cols };
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const FileManager: React.FC<FileManagerProps> = ({
    originalFile,
    originalData,
    cleanedData,
    cleaningSummary,
    onSaveToDrive,
    isSavingToDrive,
    driveFeedback,
}) => {
    const originalStats = getStats(originalData);
    const cleanedStats = getStats(cleanedData);
    const cleanedFileName = originalFile?.name.split('.').slice(0, -1).join('.') + '_cleaned.csv' || 'cleaned_data.csv';

    return (
        <div className="bg-brand-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col space-y-6">
            <h2 className="text-xl font-semibold text-brand-gray-100">Process Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original File Card */}
                <div className="bg-brand-gray-900/50 p-4 rounded-lg border border-brand-gray-700">
                    <h3 className="font-semibold text-brand-gray-200 mb-3 flex items-center">
                        <InfoIcon className="w-5 h-5 mr-2 text-brand-gray-400"/>
                        Original File Details
                    </h3>
                    <div className="flex items-center space-x-3 text-sm">
                        <FileIcon className="w-8 h-8 text-brand-gray-500 flex-shrink-0" />
                        <p className="font-mono text-brand-gray-300 truncate" title={originalFile?.name}>{originalFile?.name || 'pasted_data.txt'}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-brand-gray-400">File Size</p><p className="font-medium text-brand-gray-200">{formatBytes(originalFile?.size || 0)}</p></div>
                        <div><p className="text-brand-gray-400">Encoding</p><p className="font-medium text-brand-gray-200">UTF-8</p></div>
                        <div><p className="text-brand-gray-400">Data Rows</p><p className="font-medium text-brand-gray-200">{originalStats.rows}</p></div>
                        <div><p className="text-brand-gray-400">Columns</p><p className="font-medium text-brand-gray-200">{originalStats.cols}</p></div>
                    </div>
                </div>

                {/* Cleaned File Card */}
                <div className="bg-brand-gray-900/50 p-4 rounded-lg border border-brand-blue-light/50">
                    <h3 className="font-semibold text-brand-blue-light mb-3 flex items-center">
                        <InfoIcon className="w-5 h-5 mr-2 text-brand-blue-light"/>
                        Cleaned File Details
                    </h3>
                    <div className="flex items-center space-x-3 text-sm">
                        <FileIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
                        <p className="font-mono text-brand-gray-300 truncate" title={cleanedFileName}>{cleanedFileName}</p>
                    </div>
                     <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-brand-gray-400">File Size</p><p className="font-medium text-brand-gray-200">{formatBytes(new Blob([cleanedData]).size)}</p></div>
                        <div><p className="text-brand-gray-400">Format</p><p className="font-medium text-brand-gray-200">Standard CSV</p></div>
                        <div><p className="text-brand-gray-400">Data Rows</p><p className="font-medium text-brand-gray-200">{cleanedStats.rows}</p></div>
                        <div><p className="text-brand-gray-400">Columns</p><p className="font-medium text-brand-gray-200">{cleanedStats.cols}</p></div>
                    </div>
                </div>
            </div>
            
            {cleaningSummary.length > 0 && (
                <div className="border-t border-brand-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-brand-gray-200 mb-3 flex items-center">
                        <ChecklistIcon className="w-6 h-6 mr-3 text-brand-blue-light" />
                        Cleaning Actions Performed
                    </h3>
                    <ul className="space-y-2 pl-2">
                        {cleaningSummary.map((action, index) => (
                            <li key={index} className="flex items-start">
                                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-brand-gray-300">{action}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="border-t border-brand-gray-700 pt-6">
                 <button
                    onClick={onSaveToDrive}
                    disabled={isSavingToDrive}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-brand-gray-600 text-base font-medium rounded-md shadow-sm text-brand-gray-200 bg-brand-gray-700 hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-500 focus:ring-offset-brand-gray-900 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isSavingToDrive ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <GoogleDriveIcon className="w-5 h-5 mr-2" />}
                    {isSavingToDrive ? 'Saving...' : 'Save Cleaned File to Drive'}
                </button>
                {driveFeedback && (
                    <div className={`mt-3 text-center text-sm transition-opacity duration-300 ${driveFeedback.type === 'success' ? 'text-green-400' : 'text-brand-gray-400'}`}>
                        {driveFeedback.message}
                    </div>
                )}
            </div>
        </div>
    );
};
