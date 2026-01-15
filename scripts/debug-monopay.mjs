#!/usr/bin/env node

// Debug test to see actual error responses
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zoezuvdsebnnbrwziosb.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_p9oQsG-4xJH4MSq7qOX0NQ_nV-LXnwj';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugMonopay() {
  console.log('🔍 DEBUGGING MONOBANK FUNCTION');
  console.log('============================\n');

  // Test with detailed error logging
  const testData = {
    amount: 100.50,
    orderId: 'debug-test-' + Date.now(),
    redirectUrl: 'http://localhost:5173/payment/debug-test'
  };

  console.log('Sending test request...');
  console.log('Data:', JSON.stringify(testData, null, 2));

  try {
    const response = await supabase.functions.invoke('monopay', {
      body: testData,
      headers: { 'action': 'create' }
    });

    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('Error caught:');
    console.log('Name:', error.name);
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    
    if (error.context) {
      console.log('Context:', JSON.stringify(error.context, null, 2));
    }
  }
}

debugMonopay();