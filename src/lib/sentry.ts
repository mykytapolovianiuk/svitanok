

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';

export function initSentry() {
  
  if (!SENTRY_DSN || ENVIRONMENT === 'development') {
    if (ENVIRONMENT === 'development') {
      
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
      
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0, 
      
      
      
      
      
      
      release: `svitanok@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      
      
      beforeSend(event, hint) {
        
        if (ENVIRONMENT === 'development') {
          return null;
        }
        
        
        if (event.request) {
          
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          
          
          if (event.request.url) {
            const url = new URL(event.request.url);
            url.searchParams.delete('token');
            url.searchParams.delete('key');
            event.request.url = url.toString();
          }
        }
        
        
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        
        return event;
      },
      
      
      ignoreErrors: [
        
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        'fb_xd_fragment',
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        
        'NetworkError',
        'Failed to fetch',
        'Network request failed',
        
        'Blocked a frame',
      ],
    });

    
  } catch (error) {
    console.error('[Sentry] Initialization error:', error);
  }
}


export function setSentryUser(user: { id: string; email?: string; role?: string }) {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}


export function clearSentryUser() {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}


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


export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!SENTRY_DSN) {
    
    return;
  }
  
  Sentry.captureMessage(message, level);
}

