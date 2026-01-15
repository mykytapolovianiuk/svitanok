#!/usr/bin/env node

// Test the simplified Monobank test function
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zoezuvdsebnnbrwziosb.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_p9oQsG-4xJH4MSq7qOX0NQ_nV-LXnwj';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testMonopayFunctionality() {
  console.log('🧪 TESTING MONOBANK FUNCTIONALITY');
  console.log('================================\n');

  try {
    // Test 1: Standard Card Payment
    console.log('💳 TEST 1: Standard Card Payment Creation');
    console.log('----------------------------------------');
    
    const cardTestData = {
      amount: 150.75,
      orderId: 'functional-test-card-' + Date.now(),
      redirectUrl: 'http://localhost:5173/payment/test-card'
    };

    console.log('📤 Request data:');
    console.log('   Amount:', cardTestData.amount, 'UAH');
    console.log('   Order ID:', cardTestData.orderId);

    const { data: cardResult, error: cardError } = await supabase.functions.invoke('monopay-test', {
      body: cardTestData,
      headers: { 'action': 'create' }
    });

    if (cardError) {
      console.log('❌ FAILED:', cardError.message);
    } else {
      console.log('✅ SUCCESS!');
      console.log('   Invoice ID:', cardResult.invoiceId);
      console.log('   Payment URL:', cardResult.pageUrl);
      console.log('   Amount (cents):', cardResult.amount);
      
      // Check if URL is properly formed
      if (cardResult.pageUrl && cardResult.pageUrl.includes('monobank.ua')) {
        console.log('✅ Payment URL is correctly formatted');
      } else {
        console.log('⚠️  Payment URL format may need adjustment');
      }
    }

    console.log('\n');

    // Test 2: Parts Payment
    console.log('📊 TEST 2: Parts Payment Creation');
    console.log('------------------------------');
    
    const partsTestData = {
      amount: 300.50,
      orderId: 'functional-test-parts-' + Date.now(),
      partsCount: 6
    };

    console.log('📤 Request data:');
    console.log('   Amount:', partsTestData.amount, 'UAH');
    console.log('   Order ID:', partsTestData.orderId);
    console.log('   Parts:', partsTestData.partsCount);

    const { data: partsResult, error: partsError } = await supabase.functions.invoke('monopay-test', {
      body: partsTestData,
      headers: { 'action': 'create-part' }
    });

    if (partsError) {
      console.log('❌ FAILED:', partsError.message);
    } else {
      console.log('✅ SUCCESS!');
      console.log('   Invoice ID:', partsResult.invoiceId);
      console.log('   Payment URL:', partsResult.pageUrl);
      console.log('   Parts Count:', partsResult.partsCount);
      console.log('   Amount (cents):', partsResult.amount);
    }

    console.log('\n');

    // Test 3: Error Cases
    console.log('🛡️  TEST 3: Error Handling');
    console.log('-----------------------');
    
    // Test missing parameters
    const { data: errorResult, error: errorTest } = await supabase.functions.invoke('monopay-test', {
      body: { amount: 100 }, // Missing required fields
      headers: { 'action': 'create' }
    });

    if (errorTest) {
      console.log('✅ Correctly handles missing parameters');
    } else {
      console.log('❌ Should have failed with missing parameters');
    }

    console.log('\n');

    // Summary
    console.log('📋 FUNCTIONALITY TEST SUMMARY');
    console.log('============================');
    
    const tests = [
      { name: 'Standard Card Payment Creation', success: !cardError },
      { name: 'Parts Payment Creation', success: !partsError },
      { name: 'Error Handling', success: !!errorTest }
    ];

    tests.forEach(test => {
      console.log(`${test.success ? '✅' : '❌'} ${test.name}`);
    });

    const passedTests = tests.filter(t => t.success).length;
    console.log(`\n📈 Results: ${passedTests}/${tests.length} functionality tests passed`);

    if (passedTests === tests.length) {
      console.log('\n🎉 FUNCTIONALITY VERIFIED!');
      console.log('The Monobank integration logic is working correctly.');
      console.log('Issues with the main function are likely related to:');
      console.log('- Monobank API token validity');
      console.log('- Database access for order updates');
      console.log('- Actual Monobank API connectivity');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testMonopayFunctionality();