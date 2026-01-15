// Simplified Monobank test function for verification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  
  // Simple CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const MONOPAY_TOKEN = Deno.env.get('MONOPAY_TOKEN');
    
    if (!MONOPAY_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Missing MONOPAY_TOKEN environment variable' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === 'create') {
      const { amount, orderId, redirectUrl } = await req.json();
      
      if (!amount || !orderId || !redirectUrl) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: amount, orderId, redirectUrl' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Convert amount to cents
      const amountInCents = Math.round(amount * 100);
      
      // Mock successful response (since we can't test real Monobank API without valid token)
      const mockInvoiceId = `inv_${orderId}_${Date.now()}`;
      const mockPageUrl = `https://monobank.ua/pay/${mockInvoiceId}`;
      
      console.log(`✅ Created payment for order ${orderId}: ${amount} UAH -> ${amountInCents} cents`);
      console.log(`🔗 Payment URL: ${mockPageUrl}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: mockInvoiceId,
          pageUrl: mockPageUrl,
          amount: amountInCents
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } else if (action === 'create-part') {
      const { amount, orderId, partsCount } = await req.json();
      
      if (!amount || !orderId || !partsCount) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: amount, orderId, partsCount' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const amountInCents = Math.round(amount * 100);
      const mockInvoiceId = `parts_${orderId}_${Date.now()}`;
      const mockPageUrl = `https://monobank.ua/parts/${mockInvoiceId}`;
      
      console.log(`✅ Created parts payment for order ${orderId}: ${amount} UAH in ${partsCount} parts`);
      console.log(`🔗 Parts Payment URL: ${mockPageUrl}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          invoiceId: mockInvoiceId,
          pageUrl: mockPageUrl,
          amount: amountInCents,
          partsCount: partsCount
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use ?action=create or ?action=create-part' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});