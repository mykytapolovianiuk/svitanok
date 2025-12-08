/**
 * Analytics Module - Main Export
 * Експортує всі функції аналітики для використання в додатку
 */

export * from './dispatcher';
export * from './gtm';
export * from './ga4';
export * from './pixel';
export * from './capi';
export * from './types';
export * from './test-mode';

// Initialize analytics on import (client-side only)
if (typeof window !== 'undefined') {
  import('./dispatcher').then(({ initAnalytics }) => {
    initAnalytics();
  });
}

