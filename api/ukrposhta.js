import { getCorsHeaders } from './utils/cors';

// Helper function to get base URL based on debug mode
const getBaseUrl = () => {
  const isDebug = process.env.UKRPOSHTA_DEBUG === 'true';
  return isDebug 
    ? 'https://dev.ukrposhta.ua/ecom/0.0.1'
    : 'https://www.ukrposhta.ua/ecom/0.0.1';
};

// Helper function to make authenticated requests to Ukrposhta API
const makeUkrposhtaRequest = async (endpoint, options = {}) => {
  const baseUrl = getBaseUrl();
  const bearerToken = process.env.UKRPOSHTA_BEARER_TOKEN;
  const counterpartyToken = process.env.UKRPOSHTA_COUNTERPARTY_TOKEN;

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
};

// Handler for searching cities
const handleCities = async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query parameter must be at least 2 characters' });
  }

  try {
    // Search for cities using Ukrposhta Address Classifier API
    // This is a simplified approach - actual implementation may vary based on Ukrposhta API documentation
    const response = await makeUkrposhtaRequest(`/addresses/settlements?query=${encodeURIComponent(query)}`);
    
    // Transform response to match our CityOption format
    const cities = response.data?.map(item => ({
      value: item.id,
      label: `${item.name}, ${item.region}`,
      ref: item.id
    })) || [];

    return res.status(200).json(cities);
  } catch (error) {
    console.error('Error searching cities:', error);
    return res.status(500).json({ error: `Failed to search cities: ${error.message}` });
  }
};

// Handler for getting warehouses
const handleWarehouses = async (req, res) => {
  const { cityId } = req.query;
  
  if (!cityId) {
    return res.status(400).json({ error: 'City ID is required' });
  }

  try {
    // Get warehouses for specific city
    const response = await makeUkrposhtaRequest(`/warehouses?settlement_id=${encodeURIComponent(cityId)}`);
    
    // Transform response to match our WarehouseOption format
    const warehouses = response.data?.map(item => ({
      value: item.id,
      label: `${item.postcode} - ${item.name}`,
      ref: item.id
    })) || [];

    return res.status(200).json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return res.status(500).json({ error: `Failed to fetch warehouses: ${error.message}` });
  }
};

// Handler for creating TTN
const handleCreateTTN = async (req, res) => {
  try {
    const { orderData } = req.body;
    
    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
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
      return res.status(400).json({ error: 'Missing required delivery information' });
    }

    const counterpartyToken = process.env.UKRPOSHTA_COUNTERPARTY_TOKEN;
    
    // Step 1: Create/Get Sender Address & Client (using configured sender info)
    const senderRef = process.env.UKRPOSHTA_SENDER_REF;
    const senderContactRef = process.env.UKRPOSHTA_SENDER_CONTACT_REF;
    
    if (!senderRef || !senderContactRef) {
      return res.status(500).json({ error: 'Sender information not configured' });
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
      contents: items?.map(item => item.product_name).join(', ') || 'Beauty products'
    };

    const shipment = await makeUkrposhtaRequest('/shipments', {
      method: 'POST',
      body: shipmentPayload
    });

    // Return the created shipment/ttn information
    return res.status(200).json({
      success: true,
      ttn: shipment.data.tracking_number,
      shipment_id: shipment.data.id,
      estimated_delivery: shipment.data.estimated_delivery_date
    });

  } catch (error) {
    console.error('Error creating TTN:', error);
    return res.status(500).json({ error: `Failed to create TTN: ${error.message}` });
  }
};

// Main handler
export default async function handler(req, res) {
  // Apply CORS
  const corsHeaders = getCorsHeaders(req.headers.origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'cities':
        return await handleCities(req, res);
      
      case 'warehouses':
        return await handleWarehouses(req, res);
      
      case 'create-ttn':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        return await handleCreateTTN(req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('Ukrposhta API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}