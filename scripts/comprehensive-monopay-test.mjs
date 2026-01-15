#!/usr/bin/env node

// Comprehensive test for Monobank payment integration
import { createClient } from '@supabase/supabase-js';

// Configuration from .env
const SUPABASE_URL = 'https://zoezuvdsebnnbrwziosb.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_p9oQsG-4xJH4MSq7qOX0NQ_nV-LXnwj';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔍 TESTING MONOBANK PAYMENT INTEGRATION');
console.log('=====================================\n');

async function testMonobankIntegration() {
  try {
    // Test 1: Standard Card Payment Creation
    console.log('💳 TEST 1: Standard Card Payment Creation');
    console.log('----------------------------------------');
    
    const cardPaymentData = {
      amount: 150.75,
      orderId: 'test-card-payment-' + Date.now(),
      redirectUrl: 'http://localhost:5173/payment/test-card-payment'
    };

    console.log('📤 Sending request to create card payment...');
    console.log('   Amount:', cardPaymentData.amount, 'UAH');
    console.log('   Order ID:', cardPaymentData.orderId);
    console.log('   Redirect URL:', cardPaymentData.redirectUrl);

    const { data: cardData, error: cardError } = await supabase.functions.invoke('monopay', {
      body: cardPaymentData,
      headers: { 'action': 'create' }
    });

    if (cardError) {
      console.log('❌ FAILED: Card payment creation failed');
      console.log('   Error:', cardError.message);
      console.log('   Details:', JSON.stringify(cardError, null, 2));
    } else {
      console.log('✅ SUCCESS: Card payment created successfully');
      console.log('   Invoice ID:', cardData.invoiceId);
      console.log('   Payment URL:', cardData.pageUrl);
      console.log('   Amount (cents):', cardData.amount);
      
      // Verify URL format
      if (cardData.pageUrl && cardData.pageUrl.includes('monobank')) {
        console.log('✅ Payment URL contains Monobank domain');
      } else {
        console.log('⚠️  Warning: Payment URL may not be Monobank');
      }
    }

    console.log('\n');

    // Test 2: Parts Payment Creation
    console.log('📊 TEST 2: Parts Payment Creation (Installments)');
    console.log('----------------------------------------------');
    
    const partsPaymentData = {
      amount: 300.50,
      orderId: 'test-parts-payment-' + Date.now(),
      partsCount: 6
    };

    console.log('📤 Sending request to create parts payment...');
    console.log('   Amount:', partsPaymentData.amount, 'UAH');
    console.log('   Order ID:', partsPaymentData.orderId);
    console.log('   Parts Count:', partsPaymentData.partsCount);

    const { data: partsData, error: partsError } = await supabase.functions.invoke('monopay', {
      body: partsPaymentData,
      headers: { 'action': 'create-part' }
    });

    if (partsError) {
      console.log('❌ FAILED: Parts payment creation failed');
      console.log('   Error:', partsError.message);
      console.log('   Details:', JSON.stringify(partsError, null, 2));
    } else {
      console.log('✅ SUCCESS: Parts payment created successfully');
      console.log('   Invoice ID:', partsData.invoiceId);
      console.log('   Payment URL:', partsData.pageUrl);
      console.log('   Parts Count:', partsData.partsCount);
      console.log('   Amount (cents):', partsData.amount);
    }

    console.log('\n');

    // Test 3: Invalid Parameters Handling
    console.log('🛡️  TEST 3: Error Handling (Missing Parameters)');
    console.log('---------------------------------------------');
    
    const invalidData = {
      amount: 100 // Missing orderId and redirectUrl
    };

    const { data: invalidResponse, error: invalidError } = await supabase.functions.invoke('monopay', {
      body: invalidData,
      headers: { 'action': 'create' }
    });

    if (invalidError) {
      console.log('✅ SUCCESS: Properly rejected invalid request');
      console.log('   Error message:', invalidError.message);
    } else {
      console.log('❌ FAILED: Should have rejected invalid request');
      console.log('   Response:', JSON.stringify(invalidResponse, null, 2));
    }

    console.log('\n');

    // Test 4: Invalid Action Handling
    console.log('⚙️  TEST 4: Invalid Action Handling');
    console.log('---------------------------------');
    
    const { data: invalidActionData, error: invalidActionError } = await supabase.functions.invoke('monopay', {
      body: {},
      headers: { 'action': 'non-existent-action' }
    });

    if (invalidActionError) {
      console.log('✅ SUCCESS: Properly rejected invalid action');
      console.log('   Error message:', invalidActionError.message);
    } else {
      console.log('❌ FAILED: Should have rejected invalid action');
    }

    console.log('\n');

    // Summary
    console.log('📋 TEST SUMMARY');
    console.log('===============');
    
    const tests = [
      { name: 'Standard Card Payment', success: !cardError },
      { name: 'Parts Payment', success: !partsError },
      { name: 'Error Handling', success: !!invalidError },
      { name: 'Invalid Action Handling', success: !!invalidActionError }
    ];

    tests.forEach(test => {
      console.log(`${test.success ? '✅' : '❌'} ${test.name}`);
    });

    const passedTests = tests.filter(t => t.success).length;
    console.log(`\n📈 Results: ${passedTests}/${tests.length} tests passed`);

    if (passedTests === tests.length) {
      console.log('\n🎉 ALL TESTS PASSED! Monobank integration is working correctly.');
      console.log('\n📝 NEXT STEPS:');
      console.log('1. Test actual payment flow in browser');
      console.log('2. Verify webhook receives payment status updates');
      console.log('3. Check order status updates in database');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }

  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
testMonobankIntegration();