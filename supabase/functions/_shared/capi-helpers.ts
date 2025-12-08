/**
 * Shared helpers for CAPI Edge Functions
 */

// CORS headers тепер визначаються динамічно через getCorsHeaders()
// Цей експорт залишається для зворотної сумісності, але не використовується
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function hashPII(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface FacebookEventData {
  event_name: string;
  event_time: number;
  event_id?: string;
  event_source_url: string;
  action_source: 'website';
  user_data: Record<string, any>;
  custom_data?: Record<string, any>;
}

export async function sendToFacebook(
  pixelId: string,
  accessToken: string,
  eventData: FacebookEventData,
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
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export function isTestMode(
  accessToken: string | undefined,
  pixelId: string | undefined,
  testEventCode: string | undefined
): boolean {
  return (
    accessToken === 'TEST_TOKEN' ||
    accessToken === undefined ||
    pixelId?.includes('TEST') ||
    pixelId?.includes('test') ||
    !!testEventCode
  );
}

export function createTestResponse(message: string) {
  return new Response(
    JSON.stringify({
      success: true,
      test_mode: true,
      message,
      events_received: 1,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

export function createErrorResponse(error: any, status: number = 500) {
  return new Response(
    JSON.stringify({
      error: error.message || 'Internal server error',
      details: error,
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

