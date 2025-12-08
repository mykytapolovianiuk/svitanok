// api/telegram-notify.js
import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';

/**
 * Vercel Serverless Function for sending Telegram notifications
 * Triggered after successful order creation
 */
export default async function handler(req, res) {
  // Set CORS headers
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
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Production logging removed
    // Production logging removed
    
    // Get environment variables
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Log environment variables for debugging (without exposing actual values)
    // Environment variables check removed for production

    // Validate environment variables
    if (!BOT_TOKEN || !CHAT_ID) {
      // Error handling in production
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get order data from request body
    // Handle both direct calls and Supabase webhook format
    let orderData;
    if (req.body.record) {
      // Supabase webhook format
      orderData = req.body.record;
    } else {
      // Direct API call format
      orderData = req.body.orderData;
    }
    
    // Production logging removed
    // Production logging removed

    // Validate order data
    if (!orderData) {
      return res.status(400).json({ error: 'Missing order data' });
    }

    // Format delivery method for display
    const formatDeliveryMethod = (method) => {
      switch (method) {
        case 'nova_poshta_dept': return 'Нова Пошта (відділення)';
        case 'nova_poshta_courier': return 'Нова Пошта (кур\'єр)';
        case 'ukrposhta': return 'Укрпошта';
        default: return method;
      }
    };

    // Format the message with emojis and Ukrainian language
    let message = `📦 НОВЕ ЗАМОВЛЕННЯ #${orderData.id || 'N/A'}\n\n`;
    
    message += `👤 Клієнт: ${orderData.customer_name || 'N/A'}\n`;
    message += `📞 Телефон: ${orderData.customer_phone || 'N/A'}\n`;
    message += `📧 Email: ${orderData.customer_email || 'N/A'}\n`;
    message += `🚚 Доставка: ${formatDeliveryMethod(orderData.delivery_method)}\n`;
    
    // Add delivery info if available
    if (orderData.delivery_info) {
      if (orderData.delivery_info.city) {
        message += `🏙️ Місто: ${orderData.delivery_info.city}\n`;
      }
      if (orderData.delivery_info.warehouse) {
        message += `🏢 Відділення: ${orderData.delivery_info.warehouse}\n`;
      }
      if (orderData.delivery_info.address) {
        message += `🏠 Адреса: ${orderData.delivery_info.address}\n`;
      }
      if (orderData.delivery_info.comment) {
        message += `💬 Коментар: ${orderData.delivery_info.comment}\n`;
      }
    }
    
    message += `💰 Сума: ${orderData.total_price ? orderData.total_price.toFixed(2) : '0.00'} ₴\n\n`;
    message += `🛒 Товари:\n`;
    
    // Add items list
    // For Supabase webhook, we need to fetch items separately
    let items = orderData.items;
    if (!items && orderData.id) {
      // If items are not included, try to fetch them
      try {
        const { default: fetch } = await import('node-fetch');
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseServiceKey) {
          const itemsResponse = await fetch(`${supabaseUrl}/rest/v1/order_items?order_id=eq.${orderData.id}&select=*`, {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (itemsResponse.ok) {
            const itemsData = await itemsResponse.json();
            items = itemsData;
          }
        }
      } catch (error) {
        console.error('Error fetching order items:', error);
      }
    }
    
    if (items && Array.isArray(items) && items.length > 0) {
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.product_name || item.name || 'Невідомий товар'} `;
        message += `(x${item.quantity || 1}) - `;
        message += `${(item.price_at_purchase || item.price || 0).toFixed(2)} ₴\n`;
      });
    } else {
      message += 'Товари відсутні\n';
    }

    // Production logging removed

    // Try to send message to Telegram, but don't fail the entire request if it fails
    try {
      // Use node-fetch directly for better compatibility
      const { default: fetch } = await import('node-fetch');
      
      const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      });

      // Production logging removed

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        // Error handling in production
        // Don't return error here, continue to success response
      } else {
        // Try to parse the response
        try {
          const result = await response.json();
          // Production logging removed
          
          if (!result.ok) {
            // Error handling in production
            // Don't return error here, continue to success response
          }
        } catch (parseError) {
          // Error handling in production
          // Even if we can't parse the response, the request might have succeeded
        }
      }
    } catch (telegramError) {
      // Error handling in production
      // Don't fail the entire request if Telegram is unreachable
      // This could be due to network issues, firewalls, etc.
    }

    // Always return success to avoid breaking the checkout flow
    // The frontend doesn't depend on this response for anything critical
    res.status(200).json({ 
      success: true, 
      message: 'Order processed successfully (Telegram notification may have failed)' 
    });
  } catch (error) {
    // Error handling in production
    // Even if we get an unexpected error, don't break the checkout flow
    res.status(200).json({ 
      success: true, 
      message: 'Order processed successfully (notification handler error)' 
    });
  }
}