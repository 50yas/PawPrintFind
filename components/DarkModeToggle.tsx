
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';

const DarkModeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslations();

  const handleToggle = () => {
      if (theme === 'system') setTheme('light');
      else if (theme === 'light') setTheme('dark');
      else setTheme('system');
  };

  return (
    <button
      onClick={handleToggle}
      className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 active:scale-95 group overflow-hidden shadow-sm"
      aria-label={t('theme')}
      title={`${t('theme')}: ${theme}`}
    >
      <div className="relative z-10 flex items-center justify-center">
        {theme === 'light' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="M4.93 4.93l1.41 1.41"></path>
                <path d="M17.66 17.66l1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="M6.34 17.66l-1.41 1.41"></path>
                <path d="M19.07 4.93l-1.41 1.41"></path>
            </svg>
        )}
        {theme === 'dark' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
            </svg>
        )}
        {theme === 'system' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="3" rx="2"></rect>
                <line x1="8" x2="16" y1="21" y2="21"></line>
                <line x1="12" x2="12" y1="17" y2="21"></line>
            </svg>
        )}
      </div>
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
  );
};

export default DarkModeToggle;
