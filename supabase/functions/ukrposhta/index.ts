/**
 * Supabase Edge Function - Ukrposhta Integration
 * Handles Ukrposhta API requests through a secure proxy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, logCorsAttempt } from "../_shared/cors.ts";

// Helper function to get base URL based on debug mode
function getBaseUrl(): string {
  const isDebug = Deno.env.get('UKRPOSHTA_DEBUG') === 'true';
  return isDebug 
    ? 'https://dev.ukrposhta.ua/ecom/0.0.1'
    : 'https://www.ukrposhta.ua/ecom/0.0.1';
}

// Helper function to make authenticated requests to Ukrposhta API
async function makeUkrposhtaRequest(endpoint: string, options: any = {}): Promise<any> {
  const baseUrl = getBaseUrl();
  const bearerToken = Deno.env.get('UKRPOSHTA_BEARER_TOKEN');
  const counterpartyToken = Deno.env.get('UKRPOSHTA_COUNTERPARTY_TOKEN');

  if (!bearerToken || !counterpartyToken) {
    throw new Error('Ukrposhta API tokens are not configured');
  }

  const url = `${baseUrl}${endpoint}`;
  
  const defaultHeaders = {
    'Authorization': `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
  };

  const config = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ukrposhta API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Handler for searching cities
async function handleCities(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  
  if (!query || query.length < 2) {
    return new Response(
      JSON.stringify({ error: 'Query parameter must be at least 2 characters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Search for cities using Ukrposhta Address Classifier API
    // This is a simplified approach - actual implementation may vary based on Ukrposhta API documentation
    const response = await makeUkrposhtaRequest(`/addresses/settlements?query=${encodeURIComponent(query)}`);
    
    // Transform response to match our CityOption format
    const cities = response.data?.map((item: any) => ({
      value: item.id,
      label: `${item.name}, ${item.region}`,
      ref: item.id
    })) || [];

    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    return new Response(
      JSON.stringify(cities),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error searching cities:', error);
    return new Response(
      JSON.stringify({ error: `Failed to search cities: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handler for getting warehouses
async function handleWarehouses(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const cityId = url.searchParams.get('cityId');
  
  if (!cityId) {
    return new Response(
      JSON.stringify({ error: 'City ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get warehouses for specific city
    const response = await makeUkrposhtaRequest(`/warehouses?settlement_id=${encodeURIComponent(cityId)}`);
    
    // Transform response to match our WarehouseOption format
    const warehouses = response.data?.map((item: any) => ({
      value: item.id,
      label: `${item.postcode} - ${item.name}`,
      ref: item.id
    })) || [];

    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    return new Response(
      JSON.stringify(warehouses),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch warehouses: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handler for creating TTN
async function handleCreateTTN(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { orderData } = body;
    
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: 'Order data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_info,
      items,
      total_price,
      weight = 1.0 // Default weight in kg
    } = orderData;

    // Validate required fields
    if (!customer_name || !customer_phone || !delivery_info?.city || !delivery_info?.warehouse) {
      return new Response(
        JSON.stringify({ error: 'Missing required delivery information' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const counterpartyToken = Deno.env.get('UKRPOSHTA_COUNTERPARTY_TOKEN');
    
    // Step 1: Create/Get Sender Address & Client (using configured sender info)
    const senderRef = Deno.env.get('UKRPOSHTA_SENDER_REF');
    const senderContactRef = Deno.env.get('UKRPOSHTA_SENDER_CONTACT_REF');
    
    if (!senderRef || !senderContactRef) {
      return new Response(
        JSON.stringify({ error: 'Sender information not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Create Recipient Address
    const recipientAddressPayload = {
      counterparty_token: counterpartyToken,
      type: 'INDIVIDUAL',
      country: 'UA',
      region: delivery_info.region || '',
      district: delivery_info.district || '',
      city: delivery_info.city,
      street: delivery_info.street || '',
      house_number: delivery_info.house_number || '',
      apartment: delivery_info.apartment || ''
    };

    const recipientAddress = await makeUkrposhtaRequest('/addresses', {
      method: 'POST',
      body: recipientAddressPayload
    });

    // Step 3: Create Recipient Client
    const recipientClientPayload = {
      counterparty_token: counterpartyToken,
      first_name: customer_name.split(' ')[0],
      last_name: customer_name.split(' ').slice(1).join(' ') || 'Customer',
      phone: customer_phone,
      email: customer_email || '',
      address_id: recipientAddress.data.id
    };

    const recipientClient = await makeUkrposhtaRequest('/clients', {
      method: 'POST',
      body: recipientClientPayload
    });

    // Step 4: Create Shipment
    const shipmentPayload = {
      counterparty_token: counterpartyToken,
      sender_address_id: senderRef,
      recipient_client_id: recipientClient.data.id,
      recipient_address_id: recipientAddress.data.id,
      weight: weight,
      declared_price: total_price,
      delivery_type: 'W2W', // Warehouse to Warehouse
      description: 'Beauty and skincare products',
      contents: items?.map((item: any) => item.product_name).join(', ') || 'Beauty products'
    };

    const shipment = await makeUkrposhtaRequest('/shipments', {
      method: 'POST',
      body: shipmentPayload
    });

    // Return the created shipment/ttn information
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    return new Response(
      JSON.stringify({
        success: true,
        ttn: shipment.data.tracking_number,
        shipment_id: shipment.data.id,
        estimated_delivery: shipment.data.estimated_delivery_date
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating TTN:', error);
    return new Response(
      JSON.stringify({ error: `Failed to create TTN: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Main handler
serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  logCorsAttempt(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    switch (action) {
      case 'cities':
        return await handleCities(req);
      
      case 'warehouses':
        return await handleWarehouses(req);
      
      case 'create-ttn':
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return await handleCreateTTN(req);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Ukrposhta API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});