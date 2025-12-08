/**
 * Test script for Telegram bot notification
 * Usage: node scripts/test-telegram-bot.js
 * 
 * Make sure to set environment variables:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_CHAT_ID
 * - SUPABASE_URL (optional, for full test)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = SUPABASE_URL 
  ? `${SUPABASE_URL}/functions/v1/telegram-notification`
  : null;

async function testTelegramDirect() {
  console.log('🧪 Testing direct Telegram API call...\n');

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return false;
  }

  const testMessage = `🧪 Тестове повідомлення від Svitanok Bot\n\nЦе тестова перевірка роботи бота.`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: testMessage,
      }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Direct Telegram API test: SUCCESS');
      console.log(`   Message ID: ${result.result.message_id}`);
      return true;
    } else {
      console.error('❌ Direct Telegram API test: FAILED');
      console.error(`   Error: ${result.description}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Direct Telegram API test: ERROR');
    console.error(`   ${error.message}`);
    return false;
  }
}

async function testEdgeFunction() {
  console.log('\n🧪 Testing Edge Function...\n');

  if (!EDGE_FUNCTION_URL) {
    console.log('⚠️  Edge Function URL not configured, skipping...');
    return false;
  }

  const testOrder = {
    record: {
      id: 'test-order-' + Date.now(),
      customer_name: 'Тест Користувач',
      customer_phone: '+380123456789',
      customer_email: 'test@example.com',
      delivery_method: 'nova_poshta_dept',
      delivery_info: {
        city: 'Київ',
        warehouse: 'Відділення №1',
        address: 'вул. Тестова, 1'
      },
      total_price: 1500.00
    }
  };

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify(testOrder),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Edge Function test: SUCCESS');
      console.log(`   Message ID: ${result.message_id}`);
      return true;
    } else {
      console.error('❌ Edge Function test: FAILED');
      console.error(`   Error: ${result.error || result.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Edge Function test: ERROR');
    console.error(`   ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Telegram Bot Tests\n');
  console.log('Configuration:');
  console.log(`  BOT_TOKEN: ${BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  CHAT_ID: ${CHAT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`  EDGE_FUNCTION_URL: ${EDGE_FUNCTION_URL || '❌ Not configured'}\n`);

  const directTest = await testTelegramDirect();
  const edgeTest = await testEdgeFunction();

  console.log('\n📊 Test Results:');
  console.log(`  Direct API: ${directTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Edge Function: ${edgeTest ? '✅ PASS' : '❌ FAIL'}`);

  if (directTest && edgeTest) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);

