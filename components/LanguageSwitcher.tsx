
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Language } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
    className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { locale, setLocale } = useTranslations();

  const languages = [
    { code: 'en', name: 'EN' },
    { code: 'it', name: 'IT' },
    { code: 'es', name: 'ES' },
    { code: 'fr', name: 'FR' },
    { code: 'de', name: 'DE' },
    { code: 'zh', name: 'CN' },
    { code: 'ar', name: 'AR' },
    { code: 'ro', name: 'RO' },
  ];

  return (
    <div className="relative group">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Language)}
        className={`appearance-none bg-transparent border border-transparent hover:border-white/20 text-sm font-bold rounded-lg focus:ring-2 focus:ring-primary block pl-3 pr-8 py-2 cursor-pointer transition-all uppercase ${className || 'text-foreground'}`}
        aria-label="Select language"
      >
        {languages.map(({ code, name }) => (
          <option key={code} value={code} className="text-black dark:text-white bg-white dark:bg-gray-900">
            {name}
          </option>
        ))}
      </select>
       <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 group-hover:text-primary transition-colors ${className ? 'opacity-80' : 'text-muted-foreground'}`}>
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
