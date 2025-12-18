#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with service role key for full access
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductsTable() {
  console.log('Testing products table access...');
  
  try {
    // Test 1: Check if we can read from products table
    console.log('Test 1: Reading from products table...');
    const { data: products, error: readError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('Read error:', readError);
    } else {
      console.log(`Successfully read ${products.length} products`);
      console.log('Sample products:', products.slice(0, 2));
    }
    
    // Test 2: Check table structure
    console.log('\nTest 2: Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Table info error:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('Table columns:');
      Object.keys(tableInfo[0]).forEach(key => {
        console.log(`  ${key}: ${typeof tableInfo[0][key]}`);
      });
    }
    
    // Test 3: Try a simple upsert
    console.log('\nTest 3: Testing simple upsert...');
    const testData = {
      external_id: 'test-product-001',
      name: 'Test Product',
      slug: 'test-product',
      price: 100
    };
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('products')
      .upsert(testData, {
        onConflict: 'external_id',
        returning: 'representation'
      })
      .select();
    
    if (upsertError) {
      console.error('Upsert error:', upsertError);
      console.error('Error code:', upsertError.code);
      console.error('Error message:', upsertError.message);
    } else {
      console.log('Upsert successful:', upsertData);
    }
    
  } catch (error) {
    console.error('Exception during test:', error);
  }
}

testProductsTable();