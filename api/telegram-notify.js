
import { getCorsHeaders, logCorsAttempt } from './utils/cors.js';


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

  try {
    
    
    
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    
    

    
    if (!BOT_TOKEN || !CHAT_ID) {
      
      return res.status(500).json({ error: 'Server configuration error' });
    }

    
    
    let orderData;
    if (req.body.record) {
      
      orderData = req.body.record;
    } else {
      
      orderData = req.body.orderData;
    }
    
    
    

    
    if (!orderData) {
      return res.status(400).json({ error: 'Missing order data' });
    }

    
    const formatDeliveryMethod = (method) => {
      switch (method) {
        case 'nova_poshta_dept': return 'Нова Пошта (відділення)';
        case 'nova_poshta_courier': return 'Нова Пошта (кур\'єр)';
        case 'ukrposhta': return 'Укрпошта';
        default: return method;
      }
    };

    
    let message = `📦 НОВЕ ЗАМОВЛЕННЯ #${orderData.id || 'N/A'}\n\n`;
    
    message += `👤 Клієнт: ${orderData.customer_name || 'N/A'}\n`;
    message += `📞 Телефон: ${orderData.customer_phone || 'N/A'}\n`;
    message += `📧 Email: ${orderData.customer_email || 'N/A'}\n`;
    message += `🚚 Доставка: ${formatDeliveryMethod(orderData.delivery_method)}\n`;
    
    
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
    
    
    
    let items = orderData.items;
    if (!items && orderData.id) {
      
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

    

    
    try {
      
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

      

      
      if (!response.ok) {
        const errorText = await response.text();
        
        
      } else {
        
        try {
          const result = await response.json();
          
          
          if (!result.ok) {
            
            
          }
        } catch (parseError) {
          
          
        }
      }
    } catch (telegramError) {
      
      
      
    }

    
    
    res.status(200).json({ 
      success: true, 
      message: 'Order processed successfully (Telegram notification may have failed)' 
    });
  } catch (error) {
    
    
    res.status(200).json({ 
      success: true, 
      message: 'Order processed successfully (notification handler error)' 
    });
  }
}