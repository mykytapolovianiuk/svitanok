// Monobank Payment Integration for Svitanok
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, logCorsAttempt } from "../_shared/cors.ts";

// Type definitions
interface CreateInvoiceRequest {
  amount: number;
  ccy: number;
  redirectUrl: string;
  webHookUrl: string;
  merchantPaymentId?: string;
}

interface CreatePartRequest {
  store_id: string;
  order_id: string;
  amount: number;
  parts_count: number;
  product_list: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface MonobankWebhookPayload {
  invoiceId: string;
  status: 'created' | 'processing' | 'hold' | 'success' | 'failure' | 'expired' | 'reversed';
  amount: number;
  ccy: number;
  merchantPaymentId?: string;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  products?: {
    name: string;
  } | null;
}

// Helper function to handle CORS
function handleCors(req: Request): Response | null {
  const origin = req.headers.get('origin');
  logCorsAttempt(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }
  return null;
}

// Handle standard payment invoice creation
async function handleCreateInvoice(
  req: Request, 
  supabase: any, 
  token: string, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { amount, orderId, redirectUrl } = await req.json();
    
    // Validate inputs
    if (!amount || !orderId || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, orderId, redirectUrl' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Convert amount to cents (multiply by 100)
    const amountInCents = Math.round(amount * 100);
    
    // Fetch order items for webhook identification
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        products (
          name
        ),
        quantity,
        price_at_purchase
      `)
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order items' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Prepare product list for Monobank
    const productList = orderItems?.map((item: any) => ({
      name: item.products?.name || 'Product',
      price: Math.round((item.price_at_purchase || 0) * 100),
      quantity: item.quantity || 1
    })) || [];
    
    // Call Monobank API
    const monoResponse = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': token
      },
      body: JSON.stringify({
        amount: amountInCents,
        ccy: 980, // Ukrainian hryvnia
        redirectUrl: redirectUrl,
        webHookUrl: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/payment/${orderId}`,
        merchantPaymentId: orderId.toString(),
        productList: productList
      })
    });
    
    if (!monoResponse.ok) {
      const errorText = await monoResponse.text();
      console.error('Monobank API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice', details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const monoData = await monoResponse.json();
    
    // Update order with invoice ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_id: monoData.invoiceId,
        payment_type: 'monobank_card',
        monobank_data: {
          invoiceId: monoData.invoiceId,
          pageUrl: monoData.pageUrl,
          amount: amountInCents
        }
      })
      .eq('id', orderId);
    
    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: monoData.invoiceId,
        pageUrl: monoData.pageUrl,
        amount: amountInCents
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Create invoice error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle "Purchase by Parts" payment creation
async function handleCreatePart(
  req: Request, 
  supabase: any, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { amount, orderId, partsCount } = await req.json();
    
    // Validate inputs
    if (!amount || !orderId || !partsCount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, orderId, partsCount' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate parts count (2-12 months)
    if (partsCount < 2 || partsCount > 12) {
      return new Response(
        JSON.stringify({ error: 'Parts count must be between 2 and 12' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);
    
    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        products (
          name
        ),
        quantity,
        price_at_purchase
      `)
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order items' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Prepare product list
    const productList = orderItems?.map((item: any) => ({
      name: item.products?.name || 'Product',
      price: Math.round((item.price_at_purchase || 0) * 100),
      quantity: item.quantity || 1
    })) || [];
    
    // For now, we'll mock the "Purchase by Parts" response
    // In a real implementation, you'd integrate with Monobank's parts API
    const mockInvoiceId = `parts_${orderId}_${Date.now()}`;
    const pageUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/payment/${orderId}`;
    
    // Update order with parts payment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_id: mockInvoiceId,
        payment_type: 'monobank_parts',
        monobank_data: {
          invoiceId: mockInvoiceId,
          pageUrl: pageUrl,
          amount: amountInCents,
          partsCount: partsCount,
          type: 'parts'
        }
      })
      .eq('id', orderId);
    
    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: mockInvoiceId,
        pageUrl: pageUrl,
        amount: amountInCents,
        partsCount: partsCount,
        type: 'parts'
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Create parts error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle webhook from Monobank
async function handleWebhook(
  req: Request, 
  supabase: any, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const payload: MonobankWebhookPayload = await req.json();
    
    console.log('Webhook received:', payload);
    
    // Validate required fields
    if (!payload.invoiceId || !payload.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields in webhook payload' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Find order by invoice ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('invoice_id', payload.invoiceId)
      .single();
    
    if (orderError || !order) {
      console.error('Order not found for invoice:', payload.invoiceId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Map Monobank status to our payment status
    let paymentStatus = 'pending';
    let orderStatus = 'processing';
    
    switch (payload.status) {
      case 'success':
        paymentStatus = 'paid';
        orderStatus = 'processing';
        break;
      case 'failure':
      case 'expired':
      case 'reversed':
        paymentStatus = 'failed';
        orderStatus = 'cancelled';
        break;
      case 'created':
      case 'processing':
      case 'hold':
        paymentStatus = 'pending';
        orderStatus = 'processing';
        break;
    }
    
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        monobank_data: {
          ...order.monobank_data,
          status: payload.status,
          updatedAt: new Date().toISOString()
        }
      })
      .eq('id', order.id);
    
    if (updateError) {
      console.error('Error updating order status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Order ${order.id} updated - Payment: ${paymentStatus}, Status: ${orderStatus}`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Main function
serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const MONOPAY_TOKEN = Deno.env.get('MONOPAY_TOKEN');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Parse action from query parameters
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // Route to appropriate handler
    switch (action) {
      case 'create':
        return await handleCreateInvoice(req, supabase, MONOPAY_TOKEN!, corsHeaders);
      
      case 'create-part':
        return await handleCreatePart(req, supabase, corsHeaders);
      
      case 'webhook':
        return await handleWebhook(req, supabase, corsHeaders);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use ?action=create, ?action=create-part, or ?action=webhook' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
  } catch (error) {
    console.error('Main function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
