import { createClient } from '@supabase/supabase-js';
import { parseYML } from '../src/utils/xmlParser';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// --------------------------------------------------------------------------
// 1. СЛОВНИКИ НОРМАЛІЗАЦІЇ
// --------------------------------------------------------------------------

const ATTR_KEYS_MAP: Record<string, string> = {
  'Пол': 'Стать',
  'Объем': "Об'єм",
  'Об`єм': "Об'єм",
  'Возраст': 'Вік',
  'Возрастная группа': 'Вік',
  'Вікова група': 'Вік',
  'Тип кожи': 'Тип шкіри',
  'Тип шкіри': 'Тип шкіри',
  'Проблема кожи': 'Проблема шкіри',
  'Проблема і стан шкіри': 'Проблема шкіри',
  'Состояние кожи': 'Стан шкіри',
  'Назначение и результат': 'Призначення',
  'Призначення і результат': 'Призначення',
  'Действие': 'Дія',
  'Классификация косметического средства': 'Клас косметики',
  'Класифікація косметичного засобу': 'Клас косметики',
  'Вид маски по консистенції': 'Консистенція',
  'Вид маски за призначенням': 'Вид маски',
  'Время применения': 'Час застосування',
  'Тип крема': 'Тип крему',
  'Некомедогенно': 'Некомедогенний',
  'Гипоаллергенно': 'Гіпоалергенний',
  'Страна производитель': 'Країна виробник',
  'Країна Виробника': 'Країна виробник',
  'Количество в упаковке': 'Кількість в упаковці',
  'Цвет': 'Колір',
  'Дополнительный эффект': 'Додатковий ефект',
  'Область применения': 'Область застосування'
};

const ATTR_VALUES_MAP: Record<string, string> = {
  'Да': 'Так',
  'Нет': 'Ні',
  'true': 'Так',
  'false': 'Ні',
  'Унисекс': 'Унісекс',
  'Женский': 'Жіночий',
  'Мужской': 'Чоловічий',
  'Все типы кожи': 'Всі типи шкіри',
  'Жирная': 'Жирна',
  'Сухая': 'Суха',
  'Комбинированная (Смешанная)': 'Комбінована',
  'Чувствительная': 'Чутлива',
  'Нормальная': 'Нормальна',
  'Проблемная': 'Проблемна',
  'Увядающая (зрелая)': 'Зріла',
  'Универсальный': 'Універсальний',
  'Дневной': 'Денний',
  'Ночной': 'Нічний',
  'Профессиональная': 'Професійна',
  'Масс маркет': 'Мас-маркет',
  'Аптечная': 'Аптечна',
  'Натуральная': 'Натуральна',
  'Органическая': 'Органічна',
  'Италия': 'Італія',
  'Франция': 'Франція',
  'Корея': 'Корея',
  'Испания': 'Іспанія',
  'Израиль': 'Ізраїль',
  'США': 'США',
  'Украина': 'Україна',
  'Китай': 'Китай'
};

// --------------------------------------------------------------------------
// 2. SETUP
// --------------------------------------------------------------------------

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --------------------------------------------------------------------------
// 3. HELPERS
// --------------------------------------------------------------------------

function transliterate(text: string): string {
  if (!text) return '';
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g'
  };
  return text.toLowerCase().split('').map(char => map[char] || char).join('');
}

function generateSlug(text: string): string {
  if (!text) return 'item-' + Math.floor(Math.random() * 100000);
  return transliterate(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function translateValue(val: string): string {
  if (!val) return val;
  const trimmed = val.trim();
  if (ATTR_VALUES_MAP[trimmed]) return ATTR_VALUES_MAP[trimmed];
  return trimmed;
}

// --------------------------------------------------------------------------
// 4. NORMALIZATION
// --------------------------------------------------------------------------

function normalizeAttributes(rawInput: any): Record<string, any> {
  const normalized: Record<string, any> = {};
  
  // Приводимо до масиву [{name, value}]
  let items: { name: string, value: any }[] = [];

  if (Array.isArray(rawInput)) {
    items = rawInput.map(item => ({
      name: item.name || item['@name'],
      value: item['#text'] || item.value || item
    }));
  } else if (typeof rawInput === 'object' && rawInput !== null) {
    items = Object.entries(rawInput).map(([k, v]: [string, any]) => {
      let cleanVal = v;
      if (v && typeof v === 'object' && ('#text' in v || 'value' in v)) {
        cleanVal = v['#text'] || v.value;
      }
      return { name: k, value: cleanVal };
    });
  }

  for (const { name, value } of items) {
    if (!name || value === undefined || value === null || value === '') continue;

    const rawName = name.trim();
    const cleanName = ATTR_KEYS_MAP[rawName] || rawName;
    let cleanValue: any = value;

    if (typeof cleanValue === 'string') {
      if (cleanValue.includes('|')) {
        cleanValue = cleanValue
          .split('|')
          .map(s => translateValue(s))
          .filter(Boolean);
      } else {
        cleanValue = translateValue(cleanValue);
      }
    }

    if (normalized[cleanName]) {
       if (Array.isArray(normalized[cleanName])) {
           normalized[cleanName].push(cleanValue);
       } else {
           normalized[cleanName] = [normalized[cleanName], cleanValue];
       }
       normalized[cleanName] = normalized[cleanName].flat();
    } else {
       normalized[cleanName] = cleanValue;
    }
  }

  return normalized;
}

// --------------------------------------------------------------------------
// 5. DB HELPERS
// --------------------------------------------------------------------------

const brandCache: Record<string, number> = {};

async function ensureBrand(brandName: string): Promise<number | null> {
  if (!brandName) return null;
  const normalizedName = brandName.trim();
  
  if (brandCache[normalizedName]) return brandCache[normalizedName];

  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .eq('name', normalizedName)
    .single();

  if (existing) {
    brandCache[normalizedName] = existing.id;
    return existing.id;
  }

  const slug = generateSlug(normalizedName) + '-' + Math.floor(Math.random() * 1000);
  const { data: created, error } = await supabase
    .from('brands')
    .insert({ name: normalizedName, slug: slug })
    .select('id')
    .single();

  if (error) {
    console.warn(`⚠️ Brand creation failed (${normalizedName}):`, error.message);
    return null;
  }

  console.log(`✨ New Brand: ${normalizedName}`);
  brandCache[normalizedName] = created.id;
  return created.id;
}

const categoryIdMap: Record<string, string> = {};

async function importCategories(categories: any[]) {
  console.log(`📂 Importing ${categories.length} categories...`);
  
  for (const cat of categories) {
    const extId = String(cat.id || cat['@id']);
    // Важливо: #text містить назву, бо category може мати атрибути
    const name = cat['#text'] || cat.name || cat;
    
    if (!name || typeof name !== 'string') continue;

    const { data } = await supabase
      .from('categories')
      .upsert({
        external_id: extId,
        name: name,
        slug: generateSlug(name) + '-' + extId,
        level: 0
      }, { onConflict: 'external_id' })
      .select('id')
      .single();

    if (data) categoryIdMap[extId] = data.id;
  }

  console.log('🔗 Linking categories...');
  for (const cat of categories) {
    const extId = String(cat.id || cat['@id']);
    const parentId = cat.parentId || cat['@parentId'];
    
    if (parentId && categoryIdMap[parentId]) {
      await supabase
        .from('categories')
        .update({ parent_id: categoryIdMap[parentId], level: 1 })
        .eq('external_id', extId);
    }
  }
}

// --------------------------------------------------------------------------
// 6. MAIN IMPORT
// --------------------------------------------------------------------------

async function importProducts(offers: any[]) {
  console.log(`📦 Processing ${offers.length} offers...`);
  let count = 0;

  for (const offer of offers) {
    try {
      const externalId = String(offer.id || offer['@id']);
      const name = offer.name || offer.model;
      const vendor = offer.vendor; 
      const description = offer.description;
      const price = parseFloat(offer.price);
      const oldPrice = offer.oldprice ? parseFloat(offer.oldprice) : null;
      const inStock = (offer.available === 'true' || offer.available === true);
      const vendorCode = offer.vendorCode;

      let images: string[] = [];
      if (Array.isArray(offer.picture)) images = offer.picture;
      else if (offer.picture) images = [offer.picture];

      const brandId = await ensureBrand(vendor);
      const categoryId = categoryIdMap[String(offer.categoryId)] || null;
      const cleanAttributes = normalizeAttributes(offer.param);
      if (vendor) cleanAttributes['Бренд'] = vendor.trim();

      const { error } = await supabase.from('products').upsert({
        external_id: externalId,
        name,
        slug: generateSlug(name) + '-' + externalId,
        description,
        price,
        old_price: oldPrice,
        currency: 'UAH',
        in_stock: inStock,
        brand_id: brandId,
        category_id: categoryId,
        images,
        attributes: cleanAttributes,
        vendor_code: vendorCode
      }, { onConflict: 'external_id' });

      if (error) throw error;
      
      count++;
      if (count % 50 === 0) process.stdout.write('.');

    } catch (e: any) {
      console.error(`❌ Error offer ${offer.id}:`, e.message);
    }
  }
  console.log(`\n✅ Finished! Imported ${count} products.`);
}

async function main() {
  const xmlPath = path.join(process.cwd(), 'data.xml');
  console.log(`🚀 Reading: ${xmlPath}`);
  
  if (!fs.existsSync(xmlPath)) {
    console.error('❌ data.xml not found!');
    process.exit(1);
  }

  const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
  const feed = parseYML(xmlContent);

  // --- FIX: Правильно знаходимо масив категорій ---
  let categories = [];
  if (feed.categories) {
    // Якщо categories має властивість category, значить це обгортка
    if (feed.categories.category) {
      categories = feed.categories.category;
    } else if (Array.isArray(feed.categories)) {
      categories = feed.categories;
    } else {
       // Якщо одна категорія без обгортки (рідко)
       categories = [feed.categories];
    }
  }
  
  if (categories.length > 0) {
      // Примусово робимо масивом
      const catArray = Array.isArray(categories) ? categories : [categories];
      await importCategories(catArray);
  } else {
    console.log('⚠️ No categories found');
  }

  // --- FIX: Правильно знаходимо масив товарів ---
  let offers = [];
  if (feed.offers) {
    if (feed.offers.offer) {
       offers = feed.offers.offer;
    } else if (Array.isArray(feed.offers)) {
       offers = feed.offers;
    }
  } else if (feed.products) {
    offers = feed.products;
  }

  if (offers.length > 0) {
      const offerArray = Array.isArray(offers) ? offers : [offers];
      await importProducts(offerArray);
  } else {
      console.log('⚠️ No products found in XML. Check structure (feed.offers or feed.shop.offers).');
      // Debug: print keys to help user if it fails again
      console.log('Feed Keys:', Object.keys(feed));
      if (feed.shop) console.log('Shop Keys:', Object.keys(feed.shop));
  }
}

main().catch(console.error);