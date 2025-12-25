

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Перевірка налаштування проекту...\n');


console.log('📋 Змінні оточення:');
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✅ Налаштовано' : '❌ Відсутня');
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Налаштовано' : '❌ Відсутня');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Налаштовано' : '❌ Відсутня');
console.log('  VITE_FB_PIXEL_ID:', process.env.VITE_FB_PIXEL_ID ? '✅ Налаштовано' : '⚠️  Відсутня (тестовий режим)');
console.log('  META_CAPI_ACCESS_TOKEN:', process.env.META_CAPI_ACCESS_TOKEN ? '✅ Налаштовано' : '⚠️  Відсутня (тестовий режим)');
console.log('  TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Налаштовано' : '⚠️  Відсутня');
console.log('  TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? '✅ Налаштовано' : '⚠️  Відсутня');
console.log('  LIQPAY_PUBLIC_KEY:', process.env.LIQPAY_PUBLIC_KEY ? '✅ Налаштовано' : '⚠️  Відсутня');
console.log('  LIQPAY_PRIVATE_KEY:', process.env.LIQPAY_PRIVATE_KEY ? '✅ Налаштовано' : '⚠️  Відсутня');
console.log('  VITE_NOVA_POSHTA_API_KEY:', process.env.VITE_NOVA_POSHTA_API_KEY ? '✅ Налаштовано' : '⚠️  Відсутня');
console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Налаштовано' : '⚠️  Відсутня');
console.log('');


if (supabaseUrl && supabaseKey) {
  console.log('🔌 Перевірка підключення до Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (productsError) {
      console.log('  ❌ Помилка підключення до таблиці products:', productsError.message);
    } else {
      console.log('  ✅ Підключення до products: OK');
      console.log(`  📦 Кількість товарів: ${products ? products.length : 0} (перевірено 1 запис)`);
    }
    
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    if (ordersError) {
      console.log('  ❌ Помилка підключення до таблиці orders:', ordersError.message);
    } else {
      console.log('  ✅ Підключення до orders: OK');
    }
    
    
    const { data: promoCodes, error: promoCodesError } = await supabase
      .from('promo_codes')
      .select('id, code')
      .limit(1);
    
    if (promoCodesError) {
      console.log('  ⚠️  Таблиця promo_codes не знайдена (може бути нормально, якщо міграція не виконана)');
    } else {
      console.log('  ✅ Підключення до promo_codes: OK');
    }
    
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1);
    
    if (profilesError) {
      console.log('  ❌ Помилка підключення до таблиці profiles:', profilesError.message);
    } else {
      console.log('  ✅ Підключення до profiles: OK');
    }
    
  } catch (error) {
    console.log('  ❌ Помилка підключення до Supabase:', error.message);
  }
} else {
  console.log('  ⚠️  Не вдалося перевірити підключення: відсутні змінні оточення');
}

console.log('\n✅ Перевірка завершена!');
console.log('\n💡 Для запуску локального Vercel сервера виконайте:');
console.log('   npm run dev:vercel');
console.log('\n💡 Для запуску звичайного dev сервера виконайте:');
console.log('   npm run dev');



