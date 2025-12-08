/**
 * Meta Conversions API - ViewContent Event
 * Server-side tracking for product views
 */

import crypto from 'crypto';
import { getCorsHeaders, logCorsAttempt } from '../utils/cors.js';
import { checkRateLimit } from '../utils/rateLimit.js';

function hashPII(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  logCorsAttempt(origin, [
    'https://svitanok.com',
    'https://www.svitanok.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [])
  ]);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Rate limiting
  if (!checkRateLimit(req, res, 'capi')) {
    return;
  }
  
  try {
    const {
      event_time,
      event_source_url,
      client_user_agent,
      user_data = {},
      custom_data = {},
    } = req.body;
    
    const pixelId = process.env.VITE_FB_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN || 'TEST_TOKEN';
    
    if (!pixelId) {
      if (process.env.NODE_ENV === 'development') {
        // Test mode logging removed for production
      }
      return res.status(200).json({ success: true, message: 'Pixel ID not configured (test mode)' });
    }
    
    // Test mode detection
    const isTestMode = accessToken === 'TEST_TOKEN' || pixelId.includes('TEST') || pixelId.includes('test');
    if (isTestMode) {
      // Test mode logging removed for production
      return res.status(200).json({ 
        success: true, 
        test_mode: true,
        message: 'ViewContent event logged (TEST MODE)',
        events_received: 1 
      });
    }
    
    const hashedUserData = {};
    if (user_data.email) hashedUserData.em = [hashPII(user_data.email)];
    if (user_data.phone) hashedUserData.ph = [hashPII(user_data.phone)];
    if (user_data.client_ip_address) hashedUserData.client_ip_address = user_data.client_ip_address;
    if (client_user_agent) hashedUserData.client_user_agent = client_user_agent;
    if (user_data.fbp) hashedUserData.fbp = user_data.fbp;
    if (user_data.fbc) hashedUserData.fbc = user_data.fbc;
    
    const eventData = {
      data: [{
        event_name: 'ViewContent',
        event_time: event_time || Math.floor(Date.now() / 1000),
        event_source_url: event_source_url || req.headers.referer || '',
        action_source: 'website',
        user_data: hashedUserData,
        custom_data: custom_data,
      }],
      access_token: accessToken,
    };
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      // Error logging handled by Sentry in production
      return res.status(500).json({ error: 'Failed to send ViewContent event', details: result });
    }
    
    return res.status(200).json({ success: true, events_received: result.events_received || 0 });
    
  } catch (error) {
    // Error logging handled by Sentry in production
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

