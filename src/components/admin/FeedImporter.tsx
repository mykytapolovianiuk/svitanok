import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { parseYML } from '@/utils/xmlParser';
import toast from 'react-hot-toast';

// Utility function to transliterate Cyrillic to Latin
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

// Generate URL-friendly slug
function generateSlug(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100); // Limit slug length
}

// Ensure slug uniqueness
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
      return slug; // Return as-is if we can't check
    }
    
    if (!data || data.length === 0) {
      return slug; // Slug is unique
    }
    
    // If slug exists, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 1000) {
      console.warn(`Could not generate unique slug for ${baseSlug}, returning with counter`);
      return slug;
    }
  }
}

interface CategoryMapping {
  [externalId: string]: string; // externalId -> internal UUID
}

async function importCategories(parsedCategories: any[]): Promise<CategoryMapping> {
  const categoryMapping: CategoryMapping = {};
  const categoriesToInsert: any[] = [];
  
  // First pass: Insert all categories without parent_id
  for (const category of parsedCategories) {
    try {
      const baseSlug = generateSlug(category.name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, 'categories');
      
      const categoryData = {
        external_id: category.externalId,
        name: category.name,
        slug: uniqueSlug,
        parent_id: null // Will be updated in second pass
      };
      
      categoriesToInsert.push(categoryData);
    } catch (error: any) {
      console.error(`Error preparing category ${category.externalId}: ${error.message}`);
    }
  }
  
  // Bulk insert categories
  if (categoriesToInsert.length > 0) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(categoriesToInsert, {
        onConflict: 'external_id'
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    // Create mapping from external_id to internal UUID
    if (data) {
      for (const category of data) {
        const originalCategory = parsedCategories.find(c => c.externalId === category.external_id);
        if (originalCategory) {
          categoryMapping[originalCategory.externalId] = category.id;
        }
      }
    }
  }
  
  // Second pass: Update parent_id relationships
  let updatedCount = 0;
  
  for (const category of parsedCategories) {
    if (category.parentExternalId && categoryMapping[category.parentExternalId]) {
      try {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ parent_id: categoryMapping[category.parentExternalId] })
          .eq('external_id', category.externalId);
        
        if (!updateError) {
          updatedCount++;
        }
      } catch (error: any) {
        console.error(`Error updating parent for category ${category.externalId}: ${error.message}`);
      }
    }
  }
  
  return categoryMapping;
}

async function importProducts(parsedProducts: any[], categoryMapping: CategoryMapping) {
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of parsedProducts) {
    try {
      const baseSlug = generateSlug(product.name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug, 'products', 'slug');
      
      // Map category ID
      let categoryId: string | null = null;
      if (product.categoryId && categoryMapping[product.categoryId]) {
        categoryId = categoryMapping[product.categoryId];
      }
      
      // Prepare product data
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
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error: any) {
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

export default function FeedImporter() {
  const [fileContent, setFileContent] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileContent) {
      toast.error('Please upload a YML/XML file first');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      // Parse XML
      const parsedData = parseYML(fileContent);
      
      // Import categories
      const categoryMapping = await importCategories(parsedData.categories);
      
      // Import products
      const productResult = await importProducts(parsedData.products, categoryMapping);
      
      setImportResult({
        success: true,
        message: 'Import completed successfully!',
        details: {
          categories: parsedData.categories.length,
          products: parsedData.products.length,
          productSuccess: productResult.successCount,
          productErrors: productResult.errorCount
        }
      });
      
      toast.success('Feed imported successfully!');
    } catch (error: any) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: `Import failed: ${error.message}`
      });
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Product Feed</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload YML/XML File
          </label>
          <input
            type="file"
            accept=".xml,.yml"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-100 file:text-gray-700
              hover:file:bg-gray-200"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleImport}
            disabled={isImporting || !fileContent}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              'Import Feed'
            )}
          </button>
        </div>
        
        {importResult && (
          <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {importResult.success ? (
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importResult.message}
                </h3>
                {importResult.details && (
                  <div className={`mt-2 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Categories: {importResult.details.categories}</li>
                      <li>Products: {importResult.details.products}</li>
                      <li>Successful imports: {importResult.details.productSuccess}</li>
                      <li>Failed imports: {importResult.details.productErrors}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}