// Monobank Payment Integration for Svitanok
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, logCorsAttempt } from "../_shared/cors.ts";
import { createHmac } from "node:crypto";
import { Buffer } from "node:buffer";

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

// Helper function to create signature for Monobank API
function createSignature(body: string, key: string): string {
  try {
    // Use HMAC-SHA256 for UUID-based keys
    const hmac = createHmac('sha256', key);
    hmac.update(body);
    return hmac.digest('base64');
  } catch (e) {
    console.error("HMAC Signing failed:", e);
    throw new Error("Failed to generate HMAC signature");
  }
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
    
    // Validate parts count (3-24 months)
    if (partsCount < 3 || partsCount > 24) {
      return new Response(
        JSON.stringify({ error: 'Parts count must be between 3 and 24' }),
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
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { // FIXED: Must be null for 204 status
      status: 204, 
      headers: getCorsHeaders(req.headers.get('origin')) 
    });
  }

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    // 2. Read Body (Action is inside the body now)
    const body = await req.json();
    const { action, orderId, amount, redirectUrl, partsCount } = body;

    console.log(`Request received. Action: ${action}`, body);

    if (!action) {
      return new Response(JSON.stringify({ error: "Invalid action. Use action: 'create', 'create-part', or 'webhook'" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const MONOPAY_TOKEN = Deno.env.get('MONOPAY_TOKEN');

    // --- HANDLER: Create Invoice ---
    if (action === 'create') {
      if (!MONOPAY_TOKEN) throw new Error("Missing MONOPAY_TOKEN");

      const amountCents = Math.round(amount * 100);
      
      // Monobank Request
      const resp = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
        method: 'POST',
        headers: { 'X-Token': MONOPAY_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountCents,
          ccy: 980,
          merchantPaymInfo: {
            reference: String(orderId),
            destination: `Order #${orderId}`,
            redirectUrl: redirectUrl,
            webHookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/monopay?action=webhook` // Webhook still uses URL param for Monobank callback
          }
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Monobank API: ${err}`);
      }

      const data = await resp.json();

      // DB Update
      await supabase.from('orders').update({
        invoice_id: data.invoiceId,
        payment_type: 'monobank_card',
        monobank_data: data
      }).eq('id', orderId);

      return new Response(JSON.stringify({ pageUrl: data.pageUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- HANDLER: Parts (Real Monobank API) ---
    if (action === 'create-part') {
      const MONOPAY_STORE_ID = Deno.env.get('MONOPAY_STORE_ID');
      const MONOPAY_SIGN_KEY = Deno.env.get('MONOPAY_SIGN_KEY');
      
      if (!MONOPAY_STORE_ID || !MONOPAY_SIGN_KEY) {
        throw new Error("Missing MONOPAY_STORE_ID or MONOPAY_SIGN_KEY environment variables");
      }

      // Fetch customer phone from orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('customer_phone')
        .eq('id', orderId)
        .single();
      
      if (orderError || !orderData) {
        throw new Error("Failed to fetch customer phone for order");
      }
      
      if (!orderData.customer_phone) {
        throw new Error("Customer phone is required for parts payment");
      }

      // Format phone number (ensure it starts with +380)
      let formattedPhone = orderData.customer_phone.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('380')) {
          formattedPhone = '+' + formattedPhone;
        } else if (formattedPhone.startsWith('0')) {
          formattedPhone = '+38' + formattedPhone;
        } else {
          formattedPhone = '+380' + formattedPhone;
        }
      }

      // Prepare payload for Monobank Parts API
      const payload = {
        store_order_id: String(orderId),
        client_phone: formattedPhone,
        total_sum: amount, // Send exact float amount, not cents
        invoice: {
          date: new Date().toISOString().split('T')[0],
          number: String(orderId),
          point_id: Number(MONOPAY_STORE_ID),
          source: "INTERNET"
        },
        available_programs: [{
          available_parts_count: [partsCount],
          type: "payment_installments"
        }],
        products: [{
          name: `Замовлення #${orderId}`,
          count: 1,
          sum: amount
        }]
      };

      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, MONOPAY_SIGN_KEY);
      
      if (signature === "signature_generation_failed") {
        throw new Error("Failed to generate signature for Monobank API request");
      }

      // Use correct production URL for Monobank Parts API
      const MONOBANK_PARTS_URL = 'https://u2.monobank.com.ua/api/order/create';
      
      console.log(`Sending request to: ${MONOBANK_PARTS_URL}`);
      console.log(`Store ID: ${MONOPAY_STORE_ID}`);
      console.log(`Formatted Phone: ${formattedPhone}`);
      console.log(`Payload:`, payload);

      // Call Monobank Installments API with explicit error handling
      let monoResponse;
      try {
        monoResponse = await fetch(MONOBANK_PARTS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'store-id': MONOPAY_STORE_ID,
            'signature': signature
            // NO X-Token header needed for this endpoint
          },
          body: payloadString
        });
      } catch (fetchError) {
        console.error('Network error during Monobank Parts API call:', fetchError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to connect to Monobank Parts API', 
            details: fetchError instanceof Error ? fetchError.message : String(fetchError) 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!monoResponse.ok) {
        const errorText = await monoResponse.text();
        console.error('Monobank Parts API error:', errorText);
        throw new Error(`Monobank Parts API error: ${errorText}`);
      }

      const monoData = await monoResponse.json();
      
      // Update order with parts payment info
      await supabase.from('orders').update({
        invoice_id: `parts_${orderId}`,
        payment_type: 'monobank_parts',
        monobank_data: {
          invoiceId: `parts_${orderId}`,
          pageUrl: monoData.url,
          amount: Math.round(amount * 100),
          partsCount: partsCount,
          type: 'parts',
          monobankResponse: monoData
        }
      }).eq('id', orderId);

      return new Response(JSON.stringify({ 
        pageUrl: monoData.url,
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- HANDLER: Webhook ---
    // Note: Webhooks usually come as pure JSON from Mono, so we might check URL param for 'webhook' specifically if we set it in webHookUrl above
    const url = new URL(req.url);
    if (url.searchParams.get('action') === 'webhook') {
       const { invoiceId, status } = body;
       if (invoiceId) {
         const dbStatus = status === 'success' ? 'paid' : status === 'failure' ? 'failed' : 'pending';
         await supabase.from('orders').update({ payment_status: dbStatus, monobank_data: body }).eq('invoice_id', invoiceId);
       }
       return new Response('OK', { headers: corsHeaders });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
