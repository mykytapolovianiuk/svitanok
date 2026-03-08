import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
}

const edgeFunctionUrl = `${supabaseUrl}/functions/v1/telegram-notification`;

// Dummy payload that mimics what Checkout.tsx sends
const notificationData = {
    record: {
        id: 99999, // Fake Order ID
        customer_name: "Test User",
        customer_phone: "+380991234567",
        customer_email: "test@example.com",
        delivery_method: "nova_poshta_dept",
        delivery_info: {
            full_name: "Test User",
            phone: "+380991234567",
            city: "Київ",
            warehouse: "Відділення №1",
            comment: "This is a test checkout."
        },
        payment_method: "cash",
        status: "new",
        total_price: 1500,
        order_items: [
            {
                product_id: 1,
                quantity: 2,
                price_at_purchase: 750,
                products: {
                    name: "Test Product A",
                    price: 750,
                    attributes: {}
                }
            }
        ],
        created_at: new Date().toISOString()
    }
};

console.log(`Calling Edge Function: ${edgeFunctionUrl}...`);

fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(notificationData),
})
    .then(async (res) => {
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Response Body:`, text);
    })
    .catch(err => {
        console.error("Fetch Error:", err);
    });
