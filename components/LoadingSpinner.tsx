import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-5 w-5 border-b-2',
    lg: 'h-8 w-8 border-b-2'
  };

  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-white mx-auto`}></div>
  );
};
