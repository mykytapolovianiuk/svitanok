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

async function testCategoriesTable() {
  console.log('Testing categories table access...');
  
  try {
    // Test 1: Check if we can read from categories table
    console.log('Test 1: Reading from categories table...');
    const { data: categories, error: readError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('Read error:', readError);
    } else {
      console.log(`Successfully read ${categories.length} categories`);
      console.log('Sample categories:', categories.slice(0, 2));
    }
    
    // Test 2: Check table structure
    console.log('\nTest 2: Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('categories')
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
      external_id: 'test-category-001',
      name: 'Test Category',
      slug: 'test-category'
    };
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('categories')
      .upsert(testData, {
        onConflict: 'external_id',
        returning: 'representation'
      })
      .select();
    
    if (upsertError) {
      console.error('Upsert error:', upsertError);
      console.error('Error code:', upsertError.code);
      console.error('Error message:', upsertError.message);
      console.error('Error details:', upsertError.details);
      console.error('Error hint:', upsertError.hint);
    } else {
      console.log('Upsert successful:', upsertData);
    }
    
    // Test 4: Check for duplicate slugs (simpler approach)
    console.log('\nTest 4: Checking for duplicate slugs...');
    const { data: allSlugs, error: allSlugsError } = await supabase
      .from('categories')
      .select('slug');
    
    if (allSlugsError) {
      console.error('Error fetching slugs:', allSlugsError);
    } else {
      // Count occurrences of each slug
      const slugCounts = {};
      allSlugs.forEach(row => {
        slugCounts[row.slug] = (slugCounts[row.slug] || 0) + 1;
      });
      
      // Find duplicates
      const duplicates = Object.entries(slugCounts)
        .filter(([slug, count]) => count > 1)
        .map(([slug, count]) => ({ slug, count }));
      
      if (duplicates.length > 0) {
        console.log('Found duplicate slugs:');
        duplicates.forEach(({ slug, count }) => {
          console.log(`  ${slug}: ${count} occurrences`);
        });
      } else {
        console.log('No duplicate slugs found');
      }
    }
    
  } catch (error) {
    console.error('Exception during test:', error);
  }
}

testCategoriesTable();