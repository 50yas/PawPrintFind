
import React, { createContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { translations } from '../translations';

export type Language = 'en' | 'it' | 'es' | 'fr' | 'de' | 'zh' | 'ar' | 'ro';

type LanguageContextType = {
  locale: Language;
  setLocale: (language: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLocale = (): Language => {
  if (typeof window !== 'undefined' && window.navigator) {
    const supportedLangs: Language[] = ['en', 'it', 'es', 'fr', 'de', 'zh', 'ar', 'ro'];
    const browserLang = navigator.language.split('-')[0] as Language;
    return supportedLangs.includes(browserLang) ? browserLang : 'en';
  }
  return 'en';
};


export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Language>(getInitialLocale());

  // Handle RTL languages
  useEffect(() => {
    if (locale === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const contextValue = useMemo(() => {
    const t = (key: string, values?: Record<string, string | number>) => {
      // @ts-ignore - dynamic access
      let translation = translations[locale]?.[key] || translations.en[key as keyof typeof translations.en] || key;
      if (values) {
        Object.keys(values).forEach((k) => {
          translation = translation.replace(`{{${k}}}`, String(values[k]));
        });
      }
      return translation;
    };

    return {
      locale,
      setLocale,
      t,
    };
  }, [locale]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
