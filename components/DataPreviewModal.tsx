import React, { useMemo } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: string;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({ isOpen, onClose, title, data }) => {
  if (!isOpen) return null;

  // useMemo will prevent re-parsing the CSV on every render
  const { headers, rows } = useMemo(() => {
    if (!data) return { headers: [], rows: [] };
    const lines = data.trim().split('\n');
    // Simple CSV split, assumes no commas within quoted strings
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    // Cap rows to 100 for performance in a preview
    const rowsData = lines.slice(1, 101).map(line => line.split(',').map(cell => cell.trim()));
    return { headers, rows: rowsData };
  }, [data]);

  const hasData = headers.length > 0 && rows.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col border border-brand-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-brand-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-brand-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-brand-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <XCircleIcon className="w-8 h-8" />
          </button>
        </header>
        <main className="overflow-auto">
          {hasData ? (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-brand-gray-300">
                <thead className="text-xs text-brand-gray-200 uppercase bg-brand-gray-700/80 sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-brand-gray-700 hover:bg-brand-gray-700/40 transition-colors duration-150">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 whitespace-nowrap font-mono">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.trim().split('\n').length > 101 && (
                <div className="p-4 text-center text-xs text-brand-gray-400 bg-brand-gray-900 sticky bottom-0">
                  Showing first 100 data rows.
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-brand-gray-400 flex items-center justify-center h-full">
              <p>No data to display or format is not valid CSV.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
