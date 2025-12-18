#!/usr/bin/env node

/**
 * Script to import YML/XML product feed into Supabase database
 * 
 * Usage: node src/scripts/importFeed.js
 * 
 * This script will:
 * 1. Parse the data.xml file
 * 2. Import categories with hierarchical structure
 * 3. Import products and link them to categories
 */

// Load environment variables from .env file
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load the XML parser function
const { parseYML } = require('../utils/xmlParser.cjs');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Add a small delay function to avoid overwhelming the database
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility function to transliterate Cyrillic to Latin
function transliterate(text) {
  const cyrillicToLatin = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
    'Я': 'Ya'
  };

  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

// Generate URL-friendly slug
function generateSlug(text) {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100); // Limit slug length
}

// Ensure slug uniqueness
async function ensureUniqueSlug(baseSlug, tableName, fieldName = 'slug') {
  console.log(`Ensuring unique slug: ${baseSlug} in table: ${tableName}, field: ${fieldName}`);
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    console.log(`Checking if slug exists: ${slug}`);
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq(fieldName, slug)
      .limit(1);
    
    if (error) {
      console.error(`Error checking slug uniqueness: ${error.message}`);
      return slug; // Return as-is if we can't check
    }
    
    if (!data || data.length === 0) {
      console.log(`Slug is unique: ${slug}`);
      return slug; // Slug is unique
    }
    
    // If slug exists, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
    console.log(`Slug exists, trying: ${slug}`);
    
    // Add a small delay to avoid overwhelming the database
    await delay(10);
    
    // Prevent infinite loop
    if (counter > 1000) {
      console.warn(`Could not generate unique slug for ${baseSlug}, returning with counter`);
      return slug;
    }
  }
}

// Enhanced version that also checks for existing records with same external_id
async function ensureUniqueCategorySlug(baseSlug, externalId) {
  console.log(`Ensuring unique slug for category ${externalId}: ${baseSlug}`);
  // First check if a category with this external_id already exists
  const { data: existingCategory, error: fetchError } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('external_id', externalId)
    .single();
  
  // Add a small delay to avoid overwhelming the database
  await delay(10);
  
  if (fetchError) {
    console.log(`Category ${externalId} not found in database, generating unique slug`);
    // Category doesn't exist, generate a unique slug
    return await ensureUniqueSlug(baseSlug, 'categories');
  }
  
  console.log(`Category ${externalId} found in database with slug: ${existingCategory.slug}`);
  // Category exists, return its current slug
  return existingCategory.slug;
}

async function importCategories(parsedCategories) {
  console.log(`Importing ${parsedCategories.length} categories...`);
  
  const categoryMapping = {};
  const categoriesToInsert = [];
  
  // First pass: Insert all categories without parent_id
  console.log('Preparing categories for insertion...');
  let preparedCount = 0;
  for (const category of parsedCategories) {
    try {
      console.log(`Preparing category ${++preparedCount}/${parsedCategories.length}: ${category.externalId}`);
      const baseSlug = generateSlug(category.name);
      console.log(`Generated base slug: ${baseSlug}`);
      const uniqueSlug = await ensureUniqueCategorySlug(baseSlug, category.externalId);
      console.log(`Got unique slug: ${uniqueSlug}`);
      
      const categoryData = {
        external_id: category.externalId,
        name: category.name,
        slug: uniqueSlug,
        parent_id: null // Will be updated in second pass
      };
      
      categoriesToInsert.push(categoryData);
      console.log(`Added category to insertion list`);
    } catch (error) {
      console.error(`Error preparing category ${category.externalId}: ${error.message}`);
    }
  }
  console.log(`Prepared ${categoriesToInsert.length} categories for insertion`);
  
  // Process categories in smaller batches to avoid overwhelming the database
  console.log('Processing categories in batches...');
  const batchSize = 10;
  for (let i = 0; i < categoriesToInsert.length; i += batchSize) {
    const batch = categoriesToInsert.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(categoriesToInsert.length/batchSize)} (${batch.length} categories)`);
    
    // Process each category in the batch
    for (const categoryData of batch) {
      try {
        console.log(`Processing category: ${categoryData.external_id}`);
        
        // Use upsert with proper conflict resolution
        console.log(`Upserting category ${categoryData.external_id}`);
        const { data: upsertedData, error: upsertError } = await supabase
          .from('categories')
          .upsert(categoryData, {
            onConflict: 'external_id',
            returning: 'representation'
          })
          .select();
        
        if (upsertError) {
          console.error(`Error upserting category ${categoryData.external_id}:`, upsertError.message);
          console.error(`Category data:`, JSON.stringify(categoryData, null, 2));
          // Continue with other categories instead of failing completely
          continue;
        } else if (upsertedData && upsertedData.length > 0) {
          const category = upsertedData[0];
          const originalCategory = parsedCategories.find(c => c.externalId === category.external_id);
          if (originalCategory) {
            categoryMapping[originalCategory.externalId] = category.id;
            console.log(`Successfully processed category ${category.external_id} with ID ${category.id}`);
          }
        }
        
        // Add a small delay to avoid overwhelming the database
        await delay(50);
      } catch (error) {
        console.error(`Error processing category ${categoryData.external_id}:`, error.message);
        // Continue with other categories
      }
    }
    
    // Add a longer delay between batches
    console.log(`Finished batch, waiting before next batch...`);
    await delay(500);
  }
  
  console.log(`Successfully processed categories`);
  
  // Second pass: Update parent_id relationships
  console.log('Updating category parent relationships...');
  let updatedCount = 0;
  
  // Process parent relationships in batches too
  const parentUpdates = parsedCategories.filter(category => 
    category.parentExternalId && categoryMapping[category.parentExternalId]);
  
  console.log(`Processing ${parentUpdates.length} parent relationships in batches...`);
  for (let i = 0; i < parentUpdates.length; i += batchSize) {
    const batch = parentUpdates.slice(i, i + batchSize);
    console.log(`Processing parent batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(parentUpdates.length/batchSize)} (${batch.length} relationships)`);
    
    for (const category of batch) {
      try {
        console.log(`Updating parent for category ${category.externalId}`);
        const { error: updateError } = await supabase
          .from('categories')
          .update({ parent_id: categoryMapping[category.parentExternalId] })
          .eq('external_id', category.externalId);
        
        if (updateError) {
          console.error(`Error updating parent for category ${category.externalId}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`Successfully updated parent for category ${category.externalId}`);
        }
        
        // Add a small delay to avoid overwhelming the database
        await delay(50);
      } catch (error) {
        console.error(`Error updating parent for category ${category.externalId}: ${error.message}`);
      }
    }
    
    // Add a longer delay between batches
    console.log(`Finished parent batch, waiting before next batch...`);
    await delay(500);
  }
  
  console.log(`Successfully updated ${updatedCount} category parent relationships`);
  
  return categoryMapping;
}

async function importProducts(parsedProducts, categoryMapping) {
  console.log(`Importing ${parsedProducts.length} products...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of parsedProducts) {
    try {
      const baseSlug = generateSlug(product.name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, 'products', 'slug');
      
      // Map category ID
      let categoryId = null;
      if (product.categoryId && categoryMapping[product.categoryId]) {
        categoryId = categoryMapping[product.categoryId];
      }
      
      // Prepare product data
      const productData = {
        external_id: product.externalId,
        name: product.name,
        slug: uniqueSlug,
        description: product.description || '',
        price: product.price || 0,
        old_price: product.oldPrice || null,
        currency: product.currency || 'UAH',
        images: product.images || [],
        attributes: product.attributes || {},
        in_stock: true // Default to in stock
      };
      
      // Add category_id if available
      if (categoryId) {
        productData['category_id'] = categoryId;
      }
      
      // Upsert product
      const { error: upsertError } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'external_id'
        });
      
      if (upsertError) {
        console.error(`Error importing product ${product.externalId}: ${upsertError.message}`);
        errorCount++;
      } else {
        successCount++;
      }
      
      // Log progress every 100 products
      if ((successCount + errorCount) % 100 === 0) {
        console.log(`Processed ${successCount + errorCount}/${parsedProducts.length} products...`);
      }
    } catch (error) {
      console.error(`Error processing product ${product.externalId}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`Product import completed. Success: ${successCount}, Errors: ${errorCount}`);
}

async function main() {
  try {
    console.log('Starting YML/XML feed import...');
    
    // Read XML file
    const xmlFilePath = path.join(process.cwd(), 'data.xml');
    if (!fs.existsSync(xmlFilePath)) {
      throw new Error(`XML file not found at ${xmlFilePath}`);
    }
    
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');
    console.log('XML file loaded successfully');
    
    // Parse XML
    const parsedData = parseYML(xmlContent);
    console.log('XML parsed successfully');
    console.log(`Found ${parsedData.categories.length} categories and ${parsedData.products.length} products`);
    
    // Import categories
    const categoryMapping = await importCategories(parsedData.categories);
    
    // Import products
    await importProducts(parsedData.products, categoryMapping);
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { main: main };