import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { translations } from './translations';

// Only load English by default for initial bundle size optimization
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Only preload English to reduce initial bundle
    resources: {
      en: { common: translations.en }
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
    // Lazy load other languages when needed
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Load languages on demand
    load: 'languageOnly',
    preload: ['en'], // Only preload English
  });

// Lazy load language when switching
export const loadLanguage = async (lng: string) => {
  if (i18n.hasResourceBundle(lng, 'common')) {
    return; // Already loaded
  }

  // Dynamically import the translation
  try {
    let translation;
    switch (lng) {
      case 'it':
        translation = translations.it;
        break;
      case 'es':
        translation = translations.es;
        break;
      case 'fr':
        translation = translations.fr;
        break;
      case 'de':
        translation = translations.de;
        break;
      case 'zh':
        translation = translations.zh;
        break;
      case 'ar':
        translation = translations.ar;
        break;
      case 'ro':
        translation = translations.ro;
        break;
      default:
        translation = translations.en;
    }

    i18n.addResourceBundle(lng, 'common', translation);
  } catch (error) {
    console.error(`Failed to load language ${lng}:`, error);
  }
};

// Auto-load the detected language
i18n.on('languageChanged', (lng) => {
  loadLanguage(lng);
});

export default i18n;