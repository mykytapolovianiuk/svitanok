import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8060080341:AAF3nyXynucUNQhHVm8qYznQ-GnubgPrtNQ";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") || "-5077968587";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://zoezuvdsebnnbrwziosb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZXp1dmRzZWJubmJyd3ppb3NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNDAzMiwiZXhwIjoyMDc5NDAwMDMyfQ.eIjZPnm-Pwdrki-44cI7NXxuu8oamCjH13Wqqi3zVxY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const payload = await req.json();
    const order = payload.record; // The row from 'orders' table

    if (!order) {
      return new Response("No record found", { status: 400 });
    }

    console.log(`Processing order #${order.id}`);

    // 1. Fetch Order Items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*, products(name)")
      .eq("order_id", order.id);

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
    }

    // 2. Format Delivery Info
    let deliveryText = order.delivery_method || "Не вказано";
    try {
      if (order.delivery_info) {
        let deliveryInfo = order.delivery_info;
        if (typeof deliveryInfo === 'string') {
          deliveryInfo = JSON.parse(deliveryInfo);
        }
        
        // Handle Nova Poshta / General format
        const city = deliveryInfo.city || deliveryInfo.CityDescription || "";
        const warehouse = deliveryInfo.warehouse || deliveryInfo.Description || "";
        const address = deliveryInfo.address || "";
        const fullName = deliveryInfo.full_name || "";
        const phone = deliveryInfo.phone || "";
        const comment = deliveryInfo.comment || "";
        
        deliveryText += `\n📍 ${city} ${warehouse} ${address}`;
        if (fullName) deliveryText += `\n👤 ${fullName}`;
        if (phone) deliveryText += `\n📞 ${phone}`;
        if (comment) deliveryText += `\n📝 ${comment}`;
      }
    } catch (e) {
      console.error("Error parsing delivery info", e);
    }

    // 3. Format Items List
    const itemsList = items?.map((item: any) => {
      const productName = item.products?.name || item.product_name || "Невідомий товар";
      return `▫️ <b>${productName}</b>\n   ${item.quantity} × ${item.price_at_purchase} ₴`;
    }).join("\n\n") || "Товари не знайдено (див. адмінку)";

    // 4. Format Customer Info
    const customerEmail = order.customer_email || "-";
    const customerPhone = order.customer_phone || "Не вказано";
    const paymentMethod = order.payment_method || "Не вказано";
    const orderStatus = order.status || "new";

    // 5. Construct Beautiful Message
    const message = `
<b>🔔 НОВЕ ЗАМОВЛЕННЯ #${order.id}</b>

👤 <b>Клієнт:</b> ${order.customer_name || "Не вказано"}
📞 <b>Телефон:</b> ${customerPhone}
✉️ <b>Email:</b> ${customerEmail}

🚚 <b>Доставка:</b> ${deliveryText}
💰 <b>Оплата:</b> ${paymentMethod}
📊 <b>Статус:</b> ${orderStatus}

🛒 <b>Товари:</b>
${itemsList}

<b>💵 СУМА: ${order.total_price || order.total} ₴</b>
<i>📅 ${new Date(order.created_at || new Date()).toLocaleString('uk-UA')}</i>
    `.trim();

    // 6. Send to Telegram
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const result = await res.json();
    if (!result.ok) {
      console.error("Telegram API Error:", result);
      return new Response(JSON.stringify(result), { status: 500 });
    }

    return new Response("Notification sent", { status: 200 });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(error.message, { status: 500 });
  }
});