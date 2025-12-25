
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface OrderData {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_method: string | null;
  delivery_info: {
    city?: string;
    warehouse?: string;
    address?: string;
    comment?: string;
  } | null;
  total_price: number;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  products?: {
    name: string;
  } | null;
}


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('Missing Telegram environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Telegram credentials' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase credentials' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    
    const { record }: { record: OrderData } = await req.json();

    if (!record || !record.id) {
      console.error('Invalid order data received');
      return new Response(
        JSON.stringify({ error: 'Invalid order data' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price_at_purchase,
        products (
          name
        )
      `)
      .eq('order_id', record.id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      
    }

    
    const formatDeliveryMethod = (method: string | null): string => {
      if (!method) return 'Не вказано';
      
      switch (method) {
        case 'nova_poshta_dept':
          return 'Нова Пошта (відділення)';
        case 'nova_poshta_courier':
          return 'Нова Пошта (кур\'єр)';
        case 'ukrposhta':
          return 'Укрпошта';
        case 'quick_order':
          return 'Швидке замовлення';
        default:
          return method;
      }
    };

    
    const formatAddress = (deliveryInfo: OrderData['delivery_info']): string => {
      if (!deliveryInfo) return 'Не вказано';
      
      const parts: string[] = [];
      if (deliveryInfo.city) parts.push(deliveryInfo.city);
      if (deliveryInfo.warehouse) parts.push(`Відділення: ${deliveryInfo.warehouse}`);
      if (deliveryInfo.address) parts.push(deliveryInfo.address);
      
      return parts.length > 0 ? parts.join(', ') : 'Не вказано';
    };

    
    const orderIdShort = record.id.substring(0, 8).toUpperCase();

    
    let message = `🛒 Нове замовлення #${orderIdShort}\n\n`;
    
    message += `👤 Клієнт: ${record.customer_name || 'Не вказано'}\n`;
    message += `📧 Email: ${record.customer_email || 'Не вказано'}\n`;
    message += `📱 Телефон: ${record.customer_phone || 'Не вказано'}\n\n`;
    
    message += `📦 Товари:\n`;
    
    
    if (orderItems && orderItems.length > 0) {
      orderItems.forEach((item: OrderItem) => {
        const productName = item.products?.name || `Товар #${item.product_id}`;
        const quantity = item.quantity || 1;
        const price = item.price_at_purchase || 0;
        const itemTotal = price * quantity;
        
        message += `- ${productName} x ${quantity} - ${itemTotal.toFixed(2)} ₴\n`;
      });
    } else {
      message += `- Товари відсутні\n`;
    }
    
    message += `\n💰 Сума: ${record.total_price.toFixed(2)} ₴\n\n`;
    message += `🚚 Доставка: ${formatDeliveryMethod(record.delivery_method)}\n`;
    message += `📍 Адреса: ${formatAddress(record.delivery_info)}\n`;

    console.log('Formatted message:', message);

    
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML', 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API error:', errorText);
      
      
      try {
        const errorData = JSON.parse(errorText);
        console.error('Telegram API error details:', errorData);
      } catch {
        
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send Telegram notification',
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API returned error:', result);
      return new Response(
        JSON.stringify({ 
          error: 'Telegram API error',
          details: result.description || 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Telegram notification sent successfully:', result.message_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        message_id: result.message_id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Telegram notification error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});