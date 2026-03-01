import React, { createContext, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'it' | 'es' | 'fr' | 'de' | 'zh' | 'ar' | 'ro';

type LanguageContextType = {
  locale: Language;
  setLocale: (language: Language) => void;
  t: (key: string, options?: any) => string; // Using any here because i18next types are complex, but I'll try to use a more specific type if possible.
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  
  const locale = (i18n.language?.split('-')[0] || 'en') as Language;

  const setLocale = (language: Language) => {
    i18n.changeLanguage(language);
  };

  // Handle RTL languages and HTML lang attribute
  useEffect(() => {
    const dir = i18n.dir(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, i18n]);

  const contextValue = {
    locale,
    setLocale,
    t: (key: string, options?: any) => t(key, options) as string,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};