#!/usr/bin/env node

// Test script for Monobank payment integration
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testMonopayFunction() {
  console.log('🧪 Testing Monobank Payment Integration...\n');

  try {
    // Test 1: Create standard payment
    console.log('1️⃣ Testing standard card payment creation...');
    
    const testOrder = {
      amount: 100.50,
      orderId: 'test-order-001',
      redirectUrl: 'http://localhost:5173/payment/test-order-001'
    };

    const { data: createData, error: createError } = await supabase.functions.invoke('monopay', {
      body: testOrder,
      headers: { 'action': 'create' }
    });

    if (createError) {
      console.error('❌ Standard payment creation failed:', createError);
    } else {
      console.log('✅ Standard payment creation successful');
      console.log('   Invoice ID:', createData.invoiceId);
      console.log('   Page URL:', createData.pageUrl);
      console.log('   Amount:', createData.amount);
    }

    // Test 2: Create parts payment
    console.log('\n2️⃣ Testing parts payment creation...');
    
    const testPartsOrder = {
      amount: 200.75,
      orderId: 'test-order-002',
      partsCount: 3
    };

    const { data: partsData, error: partsError } = await supabase.functions.invoke('monopay', {
      body: testPartsOrder,
      headers: { 'action': 'create-part' }
    });

    if (partsError) {
      console.error('❌ Parts payment creation failed:', partsError);
    } else {
      console.log('✅ Parts payment creation successful');
      console.log('   Invoice ID:', partsData.invoiceId);
      console.log('   Page URL:', partsData.pageUrl);
      console.log('   Parts Count:', partsData.partsCount);
    }

    // Test 3: Test invalid action
    console.log('\n3️⃣ Testing invalid action handling...');
    
    const { data: invalidData, error: invalidError } = await supabase.functions.invoke('monopay', {
      body: {},
      headers: { 'action': 'invalid-action' }
    });

    if (invalidError) {
      console.log('✅ Invalid action handling works correctly');
    } else {
      console.error('❌ Invalid action should have failed');
    }

    // Test 4: Test missing parameters
    console.log('\n4️⃣ Testing missing parameters handling...');
    
    const { data: missingData, error: missingError } = await supabase.functions.invoke('monopay', {
      body: { amount: 100 }, // Missing orderId and redirectUrl
      headers: { 'action': 'create' }
    });

    if (missingError) {
      console.log('✅ Missing parameters handling works correctly');
    } else {
      console.error('❌ Should have failed with missing parameters');
    }

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
testMonopayFunction();