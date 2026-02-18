import * as Sentry from "@sentry/react";

/**
 * MONITORING SERVICE
 * 
 * Configures Sentry for real-time error tracking and performance monitoring.
 */
export const initMonitoring = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn("Sentry DSN missing. Error tracking is disabled in this environment.");
    return;
  }

  Sentry.init({
    dsn: dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/pawprint-50\.web\.app/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    environment: import.meta.env.MODE,
  });

  console.log("🚀 Sentry Monitoring Initialized");
};

/**
 * Manually capture an error (e.g. from a try/catch block)
 */
export const captureError = (error: any, context?: any) => {
  console.error("Capturing error to Sentry:", error, context);
  Sentry.captureException(error, { extra: context });
};

/**
 * Manually capture a message
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  Sentry.captureMessage(message, level);
};
