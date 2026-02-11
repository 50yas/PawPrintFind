import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { translations } from './translations';

// Import critical JSON namespaces for synchronous loading
import enAuth from './public/locales/en/auth.json';
import enDashboard from './public/locales/en/dashboard.json';
import enCommon from './public/locales/en/common.json';

// Detect language BEFORE initialization
const detector = new LanguageDetector();
detector.init({
  order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage', 'cookie'],
});
const detectedLanguage = detector.detect()?.[0]?.split('-')[0] || 'en';

// Preload detected language resources synchronously
const preloadLanguages = ['en'];
if (detectedLanguage !== 'en' && ['it', 'es', 'fr', 'de', 'zh', 'ar', 'ro'].includes(detectedLanguage)) {
  preloadLanguages.push(detectedLanguage);
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Preload critical namespaces synchronously to prevent raw keys from showing
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard
      }
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    ns: ['common', 'auth', 'dashboard'],
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
    preload: preloadLanguages,
  });

// Lazy load language when switching
export const loadLanguage = async (lng: string) => {
  if (i18n.hasResourceBundle(lng, 'common') && i18n.hasResourceBundle(lng, 'auth')) {
    return; // Already loaded
  }

  // Dynamically import all namespaces for the language
  try {
    // Load common namespace from TypeScript translations (legacy)
    let commonTranslation;
    switch (lng) {
      case 'it':
        commonTranslation = translations.it;
        break;
      case 'es':
        commonTranslation = translations.es;
        break;
      case 'fr':
        commonTranslation = translations.fr;
        break;
      case 'de':
        commonTranslation = translations.de;
        break;
      case 'zh':
        commonTranslation = translations.zh;
        break;
      case 'ar':
        commonTranslation = translations.ar;
        break;
      case 'ro':
        commonTranslation = translations.ro;
        break;
      default:
        commonTranslation = translations.en;
    }

    // Load auth and dashboard namespaces from JSON files using HttpBackend
    // HttpBackend will handle these asynchronously
    i18n.addResourceBundle(lng, 'common', commonTranslation);

    // Preload auth and dashboard for the new language
    await i18n.loadNamespaces(['auth', 'dashboard']);
  } catch (error) {
    console.error(`Failed to load language ${lng}:`, error);
  }
};

// Auto-load the detected language
i18n.on('languageChanged', (lng) => {
  loadLanguage(lng);
});

// Initialize detected language on startup (before app renders)
export const initializeLanguage = async () => {
  const currentLang = i18n.language?.split('-')[0] || 'en';
  if (currentLang !== 'en') {
    await loadLanguage(currentLang);
  }
  return i18n;
};

export default i18n;