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

async function testCategoryUpsert() {
  console.log('Testing category upsert...');
  
  // Test data that might be causing issues
  const testData = {
    external_id: '114911730',
    name: 'Body Pro-Fit Лінія для тіла',
    slug: 'body-pro-fit-l-n-ya-dlya-t-la',
    parent_id: null
  };
  
  console.log('Testing with data:', testData);
  
  try {
    // First check if category exists
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('external_id', testData.external_id)
      .single();
    
    if (fetchError) {
      console.log('Category not found, will insert');
    } else {
      console.log('Category found:', existing);
    }
    
    // Try upsert
    console.log('Attempting upsert...');
    const { data, error } = await supabase
      .from('categories')
      .upsert(testData, {
        onConflict: 'external_id',
        returning: 'representation'
      })
      .select();
    
    if (error) {
      console.error('Upsert error:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
    } else {
      console.log('Upsert successful:', data);
    }
  } catch (error) {
    console.error('Exception during test:', error);
  }
}

testCategoryUpsert();