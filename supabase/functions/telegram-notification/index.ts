import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = "8060080341:AAF3nyXynucUNQhHVm8qYznQ-GnubgPrtNQ"; // Hardcoded for immediate fix
const CHAT_ID = "-5212340011";

serve(async (req) => {
  try {
    const { record } = await req.json();
    
    // Format message
    const message = `
📦 <b>Нове замовлення!</b>
№: <code>${record.id || 'N/A'}</code>
👤 <b>Клієнт:</b> ${record.customer_name}
📞 <b>Телефон:</b> ${record.customer_phone}
💰 <b>Сума:</b> ${record.total_price} UAH
🚚 <b>Доставка:</b> ${record.delivery_method}
    `.trim();

    // Send to Telegram
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});