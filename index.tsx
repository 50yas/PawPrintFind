
import React from 'react';
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

// App content without I18nLoader - i18n will be initialized before React renders
const AppContent = (
  <LanguageProvider>
    <ThemeProvider>
      <SnackbarProvider>
        <Sentry.ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground">Something went wrong.</div>}>
          <App />
        </Sentry.ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  </LanguageProvider>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize i18n BEFORE creating React root to prevent double-render
// This ensures translations are ready when the app first renders
initializeLanguage().then(() => {
  const root = ReactDOM.createRoot(rootElement);
  // Single render - no StrictMode, no I18nLoader state changes
  root.render(AppContent);
}).catch((error) => {
  console.error('Failed to initialize i18n:', error);
  // Render anyway with fallback language
  const root = ReactDOM.createRoot(rootElement);
  root.render(AppContent);
});
