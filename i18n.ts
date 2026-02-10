import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './translations';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: translations.en },
      it: { common: translations.it },
      es: { common: translations.es },
      fr: { common: translations.fr },
      de: { common: translations.de },
      zh: { common: translations.zh },
      ar: { common: translations.ar },
      ro: { common: translations.ro },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;