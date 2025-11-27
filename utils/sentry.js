// utils/sentry.js
/**
 * Sentry initialization dla backendu (Vercel Functions)
 * Użyj w każdym API endpoint: const Sentry = require('../utils/sentry');
 */

let Sentry = null;

// Inicjalizuj Sentry tylko raz (singleton)
if (!Sentry && process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV || 'production',
      tracesSampleRate: 0.1, // 10% of transactions
      beforeSend(event, hint) {
        // Filtruj błędy (opcjonalnie)
        return event;
      }
    });
    
    console.log('✅ [SENTRY] Initialized for backend');
  } catch (error) {
    console.warn('⚠️ [SENTRY] Failed to initialize:', error.message);
    // Zwróć mock object żeby nie psuć kodu
    Sentry = {
      captureException: () => {},
      captureMessage: () => {},
      withScope: (callback) => callback({ setTag: () => {}, setContext: () => {}, setUser: () => {} })
    };
  }
} else if (!process.env.SENTRY_DSN) {
  // Jeśli brak DSN, zwróć mock object
  Sentry = {
    captureException: () => {},
    captureMessage: () => {},
    withScope: (callback) => callback({ setTag: () => {}, setContext: () => {}, setUser: () => {} })
  };
  console.log('⚠️ [SENTRY] DSN not configured - Sentry disabled');
}

module.exports = Sentry;

