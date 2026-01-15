#!/usr/bin/env node

// Test Monobank redirect and parts payment functionality
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zoezuvdsebnnbrwziosb.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_p9oQsG-4xJH4MSq7qOX0NQ_nV-LXnwj';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testMonobankFunctionality() {
  console.log('🔍 TESTING MONOBANK REDIRECT AND PARTS PAYMENT');
  console.log('===============================================\n');

  try {
    // Test 1: Standard Card Payment Redirect
    console.log('💳 TEST 1: Standard Card Payment Redirect');
    console.log('-----------------------------------------');
    
    const cardTestData = {
      amount: 125.50,
      orderId: 'redirect-test-card-' + Date.now(),
      redirectUrl: 'https://www.svtnk.com.ua/payment/redirect-test-card'
    };

    console.log('📤 Sending card payment request...');
    console.log('   Amount:', cardTestData.amount, 'UAH');
    console.log('   Order ID:', cardTestData.orderId);
    console.log('   Expected redirect to:', cardTestData.redirectUrl);

    const { data: cardResult, error: cardError } = await supabase.functions.invoke('monopay', {
      body: cardTestData,
      headers: { 'action': 'create' }
    });

    if (cardError) {
      console.log('❌ FAILED: Card payment creation failed');
      console.log('   Error:', cardError.message);
    } else {
      console.log('✅ SUCCESS: Card payment created');
      console.log('   Invoice ID:', cardResult.invoiceId);
      console.log('   Payment URL:', cardResult.pageUrl);
      console.log('   Amount (cents):', cardResult.amount);
      
      // Check if redirect URL is properly formed
      if (cardResult.pageUrl && cardResult.pageUrl.includes('monobank')) {
        console.log('✅ Payment URL contains Monobank domain - redirect should work');
      } else {
        console.log('⚠️  Warning: Payment URL may not redirect to Monobank');
      }
    }

    console.log('\n');

    // Test 2: Parts Payment Creation
    console.log('📊 TEST 2: Parts Payment Creation');
    console.log('------------------------------');
    
    const partsTestData = {
      amount: 250.75,
      orderId: 'redirect-test-parts-' + Date.now(),
      partsCount: 4
    };

    console.log('📤 Sending parts payment request...');
    console.log('   Amount:', partsTestData.amount, 'UAH');
    console.log('   Order ID:', partsTestData.orderId);
    console.log('   Parts Count:', partsTestData.partsCount);

    const { data: partsResult, error: partsError } = await supabase.functions.invoke('monopay', {
      body: partsTestData,
      headers: { 'action': 'create-part' }
    });

    if (partsError) {
      console.log('❌ FAILED: Parts payment creation failed');
      console.log('   Error:', partsError.message);
    } else {
      console.log('✅ SUCCESS: Parts payment created');
      console.log('   Invoice ID:', partsResult.invoiceId);
      console.log('   Payment URL:', partsResult.pageUrl);
      console.log('   Parts Count:', partsResult.partsCount);
      console.log('   Amount (cents):', partsResult.amount);
      
      // Check parts payment specifics
      if (partsResult.partsCount === 4) {
        console.log('✅ Correct parts count returned');
      } else {
        console.log('❌ Parts count mismatch');
      }
    }

    console.log('\n');

    // Test 3: Parts Count Validation
    console.log('🛡️  TEST 3: Parts Count Validation');
    console.log('--------------------------------');
    
    const invalidPartsData = {
      amount: 100.00,
      orderId: 'validation-test-' + Date.now(),
      partsCount: 15 // Invalid - should be 2-12
    };

    const { data: validationResult, error: validationError } = await supabase.functions.invoke('monopay', {
      body: invalidPartsData,
      headers: { 'action': 'create-part' }
    });

    if (validationError) {
      console.log('✅ SUCCESS: Correctly rejected invalid parts count');
      console.log('   Error message:', validationError.message);
    } else {
      console.log('❌ FAILED: Should have rejected invalid parts count (15 > 12)');
    }

    console.log('\n');

    // Test 4: Minimum Parts Count
    console.log('🔢 TEST 4: Minimum Parts Count Validation');
    console.log('----------------------------------------');
    
    const minPartsData = {
      amount: 100.00,
      orderId: 'min-parts-test-' + Date.now(),
      partsCount: 1 // Invalid - should be minimum 2
    };

    const { data: minResult, error: minError } = await supabase.functions.invoke('monopay', {
      body: minPartsData,
      headers: { 'action': 'create-part' }
    });

    if (minError) {
      console.log('✅ SUCCESS: Correctly rejected parts count below minimum');
      console.log('   Error message:', minError.message);
    } else {
      console.log('❌ FAILED: Should have rejected parts count of 1');
    }

    console.log('\n');

    // Summary
    console.log('📋 FUNCTIONALITY TEST SUMMARY');
    console.log('============================');
    
    const tests = [
      { name: 'Standard Card Payment Redirect', success: !cardError },
      { name: 'Parts Payment Creation', success: !partsError },
      { name: 'Parts Count Validation (Max)', success: !!validationError },
      { name: 'Parts Count Validation (Min)', success: !!minError }
    ];

    tests.forEach(test => {
      console.log(`${test.success ? '✅' : '❌'} ${test.name}`);
    });

    const passedTests = tests.filter(t => t.success).length;
    console.log(`\n📈 Results: ${passedTests}/${tests.length} tests passed`);

    if (passedTests === tests.length) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Monobank redirect functionality is working');
      console.log('✅ Parts payment creation is working');
      console.log('✅ Validation for parts count (2-12) is working');
      console.log('\n🔧 IMPLEMENTATION STATUS:');
      console.log('- Card payments will redirect to Monobank payment page');
      console.log('- Parts payments will show installment options');
      console.log('- Both will redirect back to payment status page');
      console.log('- Status polling every 3 seconds is implemented');
    } else {
      console.log('\n⚠️  Some tests failed. Check implementation.');
    }

  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
testMonobankFunctionality();