import { createClient } from '@supabase/supabase-js';


import dotenv from 'dotenv';
dotenv.config();


const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}


const supabase = createClient(supabaseUrl, supabaseKey);


async function analyzeTable(tableName, queryModifier = null) {
  try {
    console.log(`\n🔍 Analyzing table: ${tableName}`);
    console.log('='.repeat(50));
    
    let query = supabase.from(tableName).select('*').limit(1);
    
    
    if (queryModifier) {
      query = queryModifier(query);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      console.error(`❌ Error fetching from ${tableName}:`, error.message);
      return;
    }
    
    if (!data) {
      console.log(`⚠️  No data found in ${tableName}`);
      return;
    }
    
    
    console.log(`✅ Sample record from ${tableName}:`);
    Object.keys(data).forEach(key => {
      const value = data[key];
      const type = typeof value;
      console.log(`  ${key}: ${type}`);
      
      
      if (type === 'object' && value !== null) {
        if (Array.isArray(value)) {
          console.log(`    └─ Array[${value.length}]`);
        } else {
          console.log(`    └─ Object with keys: [${Object.keys(value).join(', ')}]`);
        }
      } else if (value === null) {
        console.log(`    └─ null`);
      } else {
        console.log(`    └─ ${JSON.stringify(value).substring(0, 100)}${JSON.stringify(value).length > 100 ? '...' : ''}`);
      }
    });
  } catch (err) {
    console.error(`💥 Unexpected error analyzing ${tableName}:`, err.message);
  }
}


async function analyzeDatabase() {
  console.log('📊 Supabase Database Structure Analysis');
  console.log('=====================================');
  console.log(`🔗 Connecting to: ${supabaseUrl}`);
  
  try {
    
    const { data: test, error: testError } = await supabase.from('products').select('id').limit(1);
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      process.exit(1);
    }
    console.log('✅ Connection successful\n');
    
    
    await analyzeTable('products');
    await analyzeTable('orders');
    await analyzeTable('order_items');
    await analyzeTable('reviews');
    await analyzeTable('site_settings');
    
    console.log('\n✨ Analysis complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Compare this structure with src/types/index.ts');
    console.log('2. Update types to match actual database structure');
    console.log('3. Pay special attention to JSONB columns like attributes and delivery_info');
    
  } catch (err) {
    console.error('💥 Fatal error during analysis:', err.message);
    process.exit(1);
  }
}


analyzeDatabase();