import React from 'react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';

interface GoogleDriveInputProps {
    onDriveSelect: (data: string, fileName: string) => void;
    disabled: boolean;
}

const sampleDriveData = `product_id,product_name,category,price,stock_quantity
101,Laptop,Electronics,1200,50
102,Smartphone,Electronics,800,150
103,"Coffee Maker",Appliances,50,200
104,Desk Chair,Furniture,150,100
105,Book,"The Great Gatsby",Books,15,300
`;

export const GoogleDriveInput: React.FC<GoogleDriveInputProps> = ({ onDriveSelect, disabled }) => {
    const handleDriveClick = () => {
        alert("This is a demonstration.\nIn a real app, this would open the Google Drive file picker.");
        // Simulate selecting a file
        setTimeout(() => {
            onDriveSelect(sampleDriveData, 'sample_from_drive.csv');
        }, 500);
    };

    return (
        <div className="text-center py-8">
            <p className="text-brand-gray-400 mb-4">
                Connect to your Google Drive to select and import a file for cleaning.
            </p>
            <button
                onClick={handleDriveClick}
                disabled={disabled}
                className="inline-flex items-center justify-center px-6 py-3 border border-brand-gray-600 text-base font-medium rounded-md shadow-sm text-brand-gray-200 bg-brand-gray-700 hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-500 focus:ring-offset-brand-gray-900 transition-colors disabled:opacity-50"
            >
                <GoogleDriveIcon className="w-5 h-5 mr-3" />
                Import from Google Drive
            </button>
        </div>
    );
};
