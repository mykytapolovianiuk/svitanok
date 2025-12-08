/**
 * Sentry initialization for error monitoring
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';

export function initSentry() {
  // Only initialize in production or if DSN is provided
  if (!SENTRY_DSN || ENVIRONMENT === 'development') {
    if (ENVIRONMENT === 'development') {
      // Production logging removed
    } else {
      console.warn('[Sentry] DSN not configured, error monitoring disabled');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: [SITE_URL, 'localhost'],
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
      
      // Session Replay (optional, can be enabled later)
      // replaysSessionSampleRate: 0.1,
      // replaysOnErrorSampleRate: 1.0,
      
      // Release tracking
      release: `svitanok@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Don't send events in development
        if (ENVIRONMENT === 'development') {
          return null;
        }
        
        // Filter out sensitive information
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          
          // Remove sensitive query params
          if (event.request.url) {
            const url = new URL(event.request.url);
            url.searchParams.delete('token');
            url.searchParams.delete('key');
            event.request.url = url.toString();
          }
        }
        
        // Remove sensitive user data
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        
        return event;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        'fb_xd_fragment',
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        // Network errors that are not actionable
        'NetworkError',
        'Failed to fetch',
        'Network request failed',
        // Ad blockers
        'Blocked a frame',
      ],
    });

    // Production logging removed
  } catch (error) {
    console.error('[Sentry] Initialization error:', error);
  }
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: { id: string; email?: string; role?: string }) {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!SENTRY_DSN) {
    console.error('[Error]', error, context);
    return;
  }
  
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!SENTRY_DSN) {
    // Production logging removed
    return;
  }
  
  Sentry.captureMessage(message, level);
}

