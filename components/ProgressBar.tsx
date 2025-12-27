import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Uploading & Processing...</span>
        <span className="text-xs font-medium text-teal-700 dark:text-teal-300">{Math.round(progress)}%</span>
      </div>
      <div className="progress-bar bg-gray-200 dark:bg-gray-700">
        <div
          className="progress-bar-inner bg-teal-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};