import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  disabled?: boolean;
  onExport?: (format: 'csv' | 'json') => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'export',
  disabled = false,
  onExport
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = () => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadFile = (content: string, mimeType: string, extension: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    link.href = url;
    link.download = `${filename}_${timestamp}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      if (onExport) {
        onExport(exportFormat);
      } else {
        if (exportFormat === 'csv') {
          const csv = generateCSV();
          downloadFile(csv, 'text/csv', 'csv');
        } else {
          const json = JSON.stringify(data, null, 2);
          downloadFile(json, 'application/json', 'json');
        }
      }

      // Show success feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
          disabled || isExporting
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-primary/50'
        }`}
      >
        {isExporting ? (
          <>
            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            Exporting...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Data
          </>
        )}
      </button>

      <AnimatePresence>
        {showMenu && !isExporting && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-xs font-bold text-white hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                  <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <div>
                  <p className="font-black uppercase tracking-wider">CSV</p>
                  <p className="text-[9px] text-slate-400">Spreadsheet format</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                className="w-full px-4 py-2 text-left text-xs font-bold text-white hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-black uppercase tracking-wider">JSON</p>
                  <p className="text-[9px] text-slate-400">Raw data format</p>
                </div>
              </button>
            </div>

            <div className="px-4 py-2 bg-white/5 border-t border-white/5">
              <p className="text-[8px] text-slate-500 uppercase tracking-wider font-mono">
                {data.length} record{data.length !== 1 ? 's' : ''} ready
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
