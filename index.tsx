
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { logger } from './services/loggerService';

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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);
