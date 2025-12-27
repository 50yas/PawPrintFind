import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { UserRole } from '../types';

interface VetModeToggleProps {
  userMode: UserRole;
  setUserMode: (mode: UserRole) => void;
}

export const VetModeToggle: React.FC<VetModeToggleProps> = ({ userMode, setUserMode }) => {
  const { t } = useTranslations();
  const isVetMode = userMode === 'vet';

  const handleToggle = () => {
    setUserMode(isVetMode ? 'owner' : 'vet');
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-sm font-medium ${!isVetMode ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>{t('ownerView')}</span>
      <label htmlFor="vet-toggle" className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            id="vet-toggle"
            type="checkbox"
            className="sr-only"
            checked={isVetMode}
            onChange={handleToggle}
          />
          <div className="block bg-gray-300 dark:bg-gray-600 w-12 h-6 rounded-full vet-toggle-bg"></div>
          <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full vet-toggle-dot"></div>
        </div>
      </label>
      <span className={`text-sm font-medium ${isVetMode ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>{t('vetView')}</span>
    </div>
  );
};