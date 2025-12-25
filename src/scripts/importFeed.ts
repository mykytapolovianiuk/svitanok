#!/usr/bin/env node



import { createClient } from '@supabase/supabase-js';
import { parseYML } from '../utils/xmlParser';
import * as fs from 'fs';
import * as path from 'path';


const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}


const supabase = createClient(supabaseUrl, supabaseServiceKey);


function transliterate(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
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


function generateSlug(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100); 
}


async function ensureUniqueSlug(baseSlug: string, tableName: string, fieldName: string = 'slug'): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq(fieldName, slug)
      .limit(1);
    
    if (error) {
      console.error(`Error checking slug uniqueness: ${error.message}`);
      return slug; 
    }
    
    if (!data || data.length === 0) {
      return slug; 
    }
    
    
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    
    if (counter > 1000) {
      console.warn(`Could not generate unique slug for ${baseSlug}, returning with counter`);
      return slug;
    }
  }
}


async function ensureUniqueCategorySlug(baseSlug: string, externalId: string): Promise<string> {
  
  const { data: existingCategory, error: fetchError } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('external_id', externalId)
    .single();
  
  if (fetchError) {
    
    return await ensureUniqueSlug(baseSlug, 'categories');
  }
  
  
  return existingCategory.slug;
}

interface CategoryMapping {
  [externalId: string]: string; 
}

async function importCategories(parsedCategories: any[]): Promise<CategoryMapping> {
  console.log(`Importing ${parsedCategories.length} categories...`);
  
  const categoryMapping: CategoryMapping = {};
  const categoriesToInsert: any[] = [];
  
  
  for (const category of parsedCategories) {
    try {
      const baseSlug = generateSlug(category.name);
      const uniqueSlug = await ensureUniqueCategorySlug(baseSlug, category.externalId);
      
      const categoryData = {
        external_id: category.externalId,
        name: category.name,
        slug: uniqueSlug,
        parent_id: null 
      };
      
      categoriesToInsert.push(categoryData);
    } catch (error: any) {
      console.error(`Error preparing category ${category.externalId}: ${error.message}`);
    }
  }
  
  
  for (const categoryData of categoriesToInsert) {
    try {
      
      const { data: existingCategory, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('external_id', categoryData.external_id)
        .single();
      
      let data, error;
      
      if (existingCategory) {
        
        const { data: updatedData, error: updateError } = await supabase
          .from('categories')
          .update({
            name: categoryData.name,
            slug: categoryData.slug,
            parent_id: categoryData.parent_id
          })
          .eq('external_id', categoryData.external_id)
          .select();
        
        data = updatedData;
        error = updateError;
      } else {
        
        const { data: insertedData, error: insertError } = await supabase
          .from('categories')
          .insert(categoryData)
          .select();
        
        data = insertedData;
        error = insertError;
      }
      
      if (error) {
        console.error(`Error processing category ${categoryData.external_id}:`, error.message);
        
      } else if (data && data.length > 0) {
        const category = data[0];
        const originalCategory = parsedCategories.find(c => c.externalId === category.external_id);
        if (originalCategory) {
          categoryMapping[originalCategory.externalId] = category.id;
        }
      }
    } catch (error: any) {
      console.error(`Error processing category ${categoryData.external_id}:`, error.message);
      
    }
  }
  
  console.log(`Successfully processed ${categoriesToInsert.length} categories`);
  
  
  console.log('Updating category parent relationships...');
  let updatedCount = 0;
  
  for (const category of parsedCategories) {
    if (category.parentExternalId && categoryMapping[category.parentExternalId]) {
      try {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ parent_id: categoryMapping[category.parentExternalId] })
          .eq('external_id', category.externalId);
        
        if (updateError) {
          console.error(`Error updating parent for category ${category.externalId}: ${updateError.message}`);
        } else {
          updatedCount++;
        }
      } catch (error: any) {
        console.error(`Error updating parent for category ${category.externalId}: ${error.message}`);
      }
    }
  }
  
  console.log(`Successfully updated ${updatedCount} category parent relationships`);
  
  return categoryMapping;
}

async function importProducts(parsedProducts: any[], categoryMapping: CategoryMapping) {
  console.log(`Importing ${parsedProducts.length} products...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of parsedProducts) {
    try {
      const baseSlug = generateSlug(product.name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, 'products', 'slug');
      
      
      let categoryId: string | null = null;
      if (product.categoryId && categoryMapping[product.categoryId]) {
        categoryId = categoryMapping[product.categoryId];
      }
      
      
      const productData: any = {
        external_id: product.externalId,
        name: product.name,
        slug: uniqueSlug,
        description: product.description || '',
        price: product.price || 0,
        old_price: product.oldPrice || null,
        currency: product.currency || 'UAH',
        images: product.images || [],
        attributes: product.attributes || {},
        in_stock: true 
      };
      
      
      if (categoryId) {
        productData['category_id'] = categoryId;
      }
      
      
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
      
      
      if ((successCount + errorCount) % 100 === 0) {
        console.log(`Processed ${successCount + errorCount}/${parsedProducts.length} products...`);
      }
    } catch (error: any) {
      console.error(`Error processing product ${product.externalId}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`Product import completed. Success: ${successCount}, Errors: ${errorCount}`);
}

async function main() {
  try {
    console.log('Starting YML/XML feed import...');
    
    
    const xmlFilePath = path.join(process.cwd(), 'data.xml');
    if (!fs.existsSync(xmlFilePath)) {
      throw new Error(`XML file not found at ${xmlFilePath}`);
    }
    
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');
    console.log('XML file loaded successfully');
    
    
    const parsedData = parseYML(xmlContent);
    console.log('XML parsed successfully');
    console.log(`Found ${parsedData.categories.length} categories and ${parsedData.products.length} products`);
    
    
    const categoryMapping = await importCategories(parsedData.categories);
    
    
    await importProducts(parsedData.products, categoryMapping);
    
    console.log('Import completed successfully!');
  } catch (error: any) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}


if (require.main === module) {
  main();
}

export { main as importFeed };