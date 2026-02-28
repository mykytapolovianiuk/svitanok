import React, { useState, useCallback } from 'react';
import { parseYML } from '@/utils/xmlParser';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle, AlertCircle, FileType } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// Utility function to transliterate Cyrillic to Latin
function transliterate(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
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

// Native fetch utility to bypass supabase-js browser locking issues
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let token = anonKey;
  try {
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (storageKey) {
      const sessionStr = localStorage.getItem(storageKey);
      if (sessionStr) {
        const sessionObj = JSON.parse(sessionStr);
        if (sessionObj?.access_token) {
          token = sessionObj.access_token;
        }
      }
    }
  } catch (e) {
    console.error('Error reading token from localStorage', e);
  }

  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': options.headers && 'Prefer' in options.headers ? (options.headers as any)['Prefer'] : 'return=representation',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errMsg = errorText;
    try {
      const errObj = JSON.parse(errorText);
      errMsg = errObj.message || errObj.hint || errorText;
    } catch (e) { }
    throw new Error(errMsg);
  }

  // Not all responses have JSON bodies (like empty 204s or 201s with no content)
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

export default function FeedImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; total: number } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setImportResult(null);
      setProgress(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml']
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    if (!file) {
      toast.error('Будь ласка, завантажте XML файл.');
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    setProgress({ current: 0, total: 0, percent: 0 });

    try {
      const fileContent = await file.text();
      const parsedData = parseYML(fileContent);

      const offers = parsedData.offers?.offer;
      if (!offers) {
        throw new Error('У файлі не знайдено тегів <offer>.');
      }

      // Ensure offers is always an array
      const productsArray = Array.isArray(offers) ? offers : [offers];
      const totalProducts = productsArray.length;
      setProgress({ current: 0, total: totalProducts, percent: 0 });

      // Load reference data
      toast.loading('Завантаження довідників...', { id: 'ref-load' });

      console.log("Fetching categories...");
      // 1. Categories
      let categories: any[] = [];
      try {
        categories = await apiFetch('categories?select=id,external_id');
        console.log(`Fetched ${categories?.length || 0} categories.`);
      } catch (catError: any) {
        console.error("Category fetch error:", catError);
        throw new Error(`Помилка отримання категорій: ${catError.message}`);
      }
      const categoryMap = new Map<string, number>();
      if (categories) {
        categories.forEach(c => {
          if (c.external_id) categoryMap.set(c.external_id.toString(), c.id);
        });
      }

      console.log("Fetching brands...");
      // 2. Brands
      let brands: any[] = [];
      try {
        brands = await apiFetch('brands?select=id,name');
        console.log(`Fetched ${brands?.length || 0} brands.`);
      } catch (brandError: any) {
        console.error("Brand fetch error:", brandError);
        throw new Error(`Помилка отримання брендів: ${brandError.message}`);
      }
      const brandMap = new Map<string, number>();
      if (brands) {
        brands.forEach(b => {
          if (b.name) brandMap.set(b.name.toLowerCase(), b.id);
        });
      }

      // Ensure missing brands exist
      const vendors = Array.from(new Set(productsArray.map(p => p.vendor).filter(Boolean)));
      const missingBrands = vendors.filter(v => !brandMap.has(v.toLowerCase()));

      if (missingBrands.length > 0) {
        console.log(`Creating ${missingBrands.length} missing brands...`, missingBrands);
        toast.loading(`Створення нових брендів (${missingBrands.length})...`, { id: 'ref-load' });
        const brandsToInsert = missingBrands.map(name => ({
          name,
          slug: generateSlug(name)
        }));

        try {
          const insertedBrands = await apiFetch('brands', {
            method: 'POST',
            body: JSON.stringify(brandsToInsert)
          });

          if (insertedBrands) {
            insertedBrands.forEach((b: any) => brandMap.set(b.name.toLowerCase(), b.id));
          }
        } catch (brandInsertError: any) {
          console.error('Error inserting brands:', brandInsertError);
          toast.error('Помилка при створенні брендів. Продовжуємо імпорт...');
        }
      }

      toast.success('Довідники завантажено', { id: 'ref-load' });
      console.log("Starting batch processing...");

      // Batched processing
      let successCount = 0;
      let errorCount = 0;
      const batchSize = 50;

      for (let i = 0; i < totalProducts; i += batchSize) {
        console.log(`Processing batch ${i} to ${i + batchSize}...`);
        const batch = productsArray.slice(i, i + batchSize);

        const productsToUpsert = batch.map(offer => {
          // Process attributes
          const attrs: Record<string, string> = {};
          if (offer.param) {
            const params = Array.isArray(offer.param) ? offer.param : [offer.param];
            params.forEach((p: any) => {
              if (p.name && p['#text']) {
                attrs[p.name] = p['#text'];
              }
            });
          }

          // Map brand / category
          const vendorName = offer.vendor;
          const brand_id = vendorName ? brandMap.get(vendorName.toLowerCase()) || null : null;
          const extCatId = offer.categoryId ? offer.categoryId.toString() : null;
          const category_id = extCatId ? categoryMap.get(extCatId) || null : null;

          // Essential fields
          const extId = offer.id ? offer.id.toString() : null;
          const name = offer.name || 'Unknown Product';

          return {
            external_id: extId,
            name: name,
            slug: `${generateSlug(name)}${extId ? "-" + extId : ""}`,
            description: offer.description || '',
            price: parseFloat(offer.price) || 0,
            images: Array.isArray(offer.picture)
              ? offer.picture
              : (offer.picture ? [offer.picture] : []),
            attributes: attrs,
            brand_id,
            category_id,
            in_stock: offer.available === 'true' || offer.available === true,
            currency: offer.currencyId || 'UAH'
          };
        });

        console.log(`Upserting ${productsToUpsert.length} products to Supabase...`);
        try {
          await apiFetch('products?on_conflict=slug', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates' }, // Upsert handling for REST API
            body: JSON.stringify(productsToUpsert)
          });

          console.log(`Upsert successful`);
          successCount += batch.length;
        } catch (error: any) {
          console.error('Error upserting batch:', error.message);
          errorCount += batch.length;
        }

        // Update progress
        const processed = Math.min(i + batchSize, totalProducts);
        setProgress({
          current: processed,
          total: totalProducts,
          percent: Math.round((processed / totalProducts) * 100)
        });
      }

      setImportResult({ success: successCount, errors: errorCount, total: totalProducts });
      toast.success('Імпорт успішно завершено!');
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Помилка імпорту: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <UploadCloud className="w-6 h-6 text-indigo-600" />
        Імпорт XML фіда
      </h2>

      <div className="space-y-6">
        {/* Drag and Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
      ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4">
            <FileType className={`w-12 h-12 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-base text-gray-700">Перетягніть XML файл сюди або натисніть для вибору</p>
                <p className="text-sm text-gray-500 mt-1">Тільки файли формату .xml</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions & Progress */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleImport}
            disabled={isImporting || !file}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isImporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Імпортування... {progress ? progress.percent + '%' : ''}
              </>
            ) : (
              'Почати імпорт'
            )}
          </button>

          {/* Progress Bar */}
          {isImporting && progress && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Прогрес</span>
                <span>{progress.current} / {progress.total} товарів</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: progress.percent + '%' }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {
          importResult && !isImporting && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Результати імпорту
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Всього знайдено</p>
                    <p className="text-2xl font-bold text-gray-900">{importResult.total}</p>
                  </div>
                  <FileType className="h-8 w-8 text-indigo-200" />
                </div>
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Успішно імпортовано</p>
                    <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Помилок</p>
                    <p className={`text-2xl font-bold ${importResult.errors > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {importResult.errors}
                    </p>
                  </div>
                  <AlertCircle className={`h-8 w-8 ${importResult.errors > 0 ? 'text-red-200' : 'text-gray-200'}`} />
                </div>
              </div>
            </div >
          )
        }
      </div >
    </div >
  );
}