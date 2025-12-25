

export * from './dispatcher';
export * from './gtm';
export * from './ga4';
export * from './pixel';
export * from './capi';
export * from './types';
export * from './test-mode';


if (typeof window !== 'undefined') {
  import('./dispatcher').then(({ initAnalytics }) => {
    initAnalytics();
  });
}

