
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  disabled: boolean;
  file: File | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FILE_TYPES = ['csv', 'json', 'txt'];

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, disabled, file }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      const selectedFile = e.dataTransfer.files?.[0];
      if (selectedFile) {
        setError(null);
        if (selectedFile.size > MAX_FILE_SIZE) {
          setError('File is too large. Max size is 5MB.');
          onFileChange(null);
          return;
        }
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !ALLOWED_FILE_TYPES.includes(fileExtension)) {
          setError(`Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}.`);
          onFileChange(null);
          return;
        }
        onFileChange(selectedFile);
      }
    }
  }, [disabled, onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setError(null);
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('File is too large. Max size is 5MB.');
        onFileChange(null);
      } else {
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !ALLOWED_FILE_TYPES.includes(fileExtension)) {
          setError(`Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}.`);
          onFileChange(null);
        } else {
          onFileChange(selectedFile);
        }
      }
    }
    // Reset file input to allow re-uploading the same file after an error
    e.target.value = '';
  };

  const dragDropClasses = isDragging
    ? 'border-blue-400 bg-brand-blue/20'
    : 'border-brand-gray-600 hover:border-blue-500 hover:bg-brand-gray-800';
  
  const finalClasses = error 
    ? 'border-red-500 bg-red-900/20 hover:border-red-400'
    : dragDropClasses;
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors duration-200 ${finalClasses} ${disabledClasses}`}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileSelect}
        onClick={() => setError(null)} // Clear error when opening file dialog
        disabled={disabled}
        accept=".csv,.json,.txt"
      />
      {error ? (
        <div className="text-center text-red-300 px-4">
          <XCircleIcon className="w-12 h-12 mx-auto" />
          <p className="mt-2 font-semibold">Upload Failed</p>
          <p className="text-xs">{error}</p>
        </div>
      ) : file ? (
          <div className="text-center">
              <FileIcon className="w-12 h-12 mx-auto text-green-400"/>
              <p className="mt-2 text-brand-gray-200 font-medium">{file.name}</p>
              <p className="text-xs text-brand-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
      ) : (
          <div className="text-center">
              <UploadIcon className="w-12 h-12 mx-auto text-brand-gray-400"/>
              <p className="mt-2 text-brand-gray-200">
              <span className="font-semibold text-brand-blue-light">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-brand-gray-400">CSV, JSON, or TXT files (Max 5MB)</p>
          </div>
      )}
    </div>
  );
};
