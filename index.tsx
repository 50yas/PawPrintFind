
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import i18n, { initializeLanguage } from './i18n';
import * as Sentry from "@sentry/react";
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { logger } from './services/loggerService';
import { registerSW } from 'virtual:pwa-register';
import { initMonitoring } from './services/monitoringService';

// Initialize Sentry Monitoring
initMonitoring();

// Register PWA Service Worker
registerSW({ immediate: true });

// Fix for missing JSX types in the environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// --- LOG INTERCEPTOR ---
// This captures all console logs from the app and sends them to our internal LoggerService
// so they can be viewed in the Admin Dashboard "System Logs" tab.
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
    logger.info(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    originalLog(...args);
};

console.warn = (...args) => {
    logger.warn(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    originalWarn(...args);
};

console.error = (...args) => {
    logger.error(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    originalError(...args);
};
// -----------------------

// I18n Loader Component - waits for i18n initialization before rendering app
const I18nLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Initialize i18n and load detected language before rendering
    initializeLanguage().then(() => {
      setI18nReady(true);
    }).catch((error) => {
      console.error('Failed to initialize i18n:', error);
      // Even if it fails, render the app with fallback language
      setI18nReady(true);
    });
  }, []);

  // Show minimal loading state while i18n initializes
  if (!i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Conditionally wrap in StrictMode (dev only)
const AppContent = (
  <I18nLoader>
    <LanguageProvider>
      <ThemeProvider>
        <SnackbarProvider>
          <Sentry.ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Something went wrong.</div>}>
            <App />
          </Sentry.ErrorBoundary>
        </SnackbarProvider>
      </ThemeProvider>
    </LanguageProvider>
  </I18nLoader>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  import.meta.env.DEV ? (
    <React.StrictMode>{AppContent}</React.StrictMode>
  ) : (
    AppContent
  )
);
