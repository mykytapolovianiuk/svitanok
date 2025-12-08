/**
 * Supabase Edge Function - Meta Conversions API AddToCart Event
 * Server-side tracking for add to cart events
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, logCorsAttempt } from "../_shared/cors.ts";

interface RequestBody {
  event_time?: number;
  event_source_url?: string;
  client_user_agent?: string;
  user_data?: {
    email?: string;
    phone?: string;
    client_ip_address?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: {
    content_ids?: string[];
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
    quantity?: number;
  };
}

async function hashPII(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendToFacebook(
  pixelId: string,
  accessToken: string,
  eventData: any,
  testEventCode?: string
): Promise<{ success: boolean; result?: any; error?: any }> {
  const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;
  const payload: any = {
    data: [eventData],
    access_token: accessToken,
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result };
    }

    return { success: true, result };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  logCorsAttempt(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const {
      event_time,
      event_source_url,
      client_user_agent,
      user_data = {},
      custom_data = {},
    } = body;

    const pixelId = Deno.env.get('VITE_FB_PIXEL_ID');
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN') || 'TEST_TOKEN';
    const testEventCode = Deno.env.get('META_TEST_EVENT_CODE');

    const isTestMode = accessToken === 'TEST_TOKEN' || 
                      pixelId?.includes('TEST') || 
                      pixelId?.includes('test') ||
                      !!testEventCode;

    if (!pixelId) {
      console.log('[CAPI] AddToCart: Pixel ID not configured, using test mode');
      return new Response(
        JSON.stringify({ 
          success: true, 
          test_mode: true,
          message: 'AddToCart event logged (TEST MODE)',
          events_received: 1 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (isTestMode) {
      console.log('[CAPI] AddToCart: Running in TEST MODE');
      return new Response(
        JSON.stringify({ 
          success: true, 
          test_mode: true,
          message: 'AddToCart event logged (TEST MODE)',
          events_received: 1 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const hashedUserData: any = {};
    if (user_data.email) hashedUserData.em = [await hashPII(user_data.email)];
    if (user_data.phone) hashedUserData.ph = [await hashPII(user_data.phone)];
    if (user_data.client_ip_address) hashedUserData.client_ip_address = user_data.client_ip_address;
    if (client_user_agent) hashedUserData.client_user_agent = client_user_agent;
    if (user_data.fbp) hashedUserData.fbp = user_data.fbp;
    if (user_data.fbc) hashedUserData.fbc = user_data.fbc;

    const eventData = {
      event_name: 'AddToCart',
      event_time: event_time || Math.floor(Date.now() / 1000),
      event_source_url: event_source_url || '',
      action_source: 'website',
      user_data: hashedUserData,
      custom_data: custom_data,
    };

    let lastError = null;
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await sendToFacebook(
        pixelId,
        accessToken,
        eventData,
        testEventCode || undefined
      );

      if (result.success) {
        console.log('[CAPI] AddToCart sent successfully:', result.result);
        return new Response(
          JSON.stringify({ 
            success: true, 
            events_received: result.result?.events_received || 0 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      lastError = result.error;
      if (result.error?.error?.code === 100 || result.error?.error?.code === 190) {
        break;
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.error('[CAPI] AddToCart error after retries:', lastError);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send AddToCart event',
        details: lastError 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CAPI] AddToCart error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

