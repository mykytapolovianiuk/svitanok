import { createClient } from '@supabase/supabase-js';
import { parseYML } from '../src/utils/xmlParser';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
// --------------------------------------------------------------------------
// 1. СЛОВНИКИ НОРМАЛІЗАЦІЇ (Адаптовано під ваш data.xml)
// --------------------------------------------------------------------------
// Переклад назв параметрів (Ключів)
const ATTR_KEYS_MAP = {
    // Основні
    'Пол': 'Стать',
    'Объем': "Об'єм",
    'Об`єм': "Об'єм",
    'Возраст': 'Вік',
    'Возрастная группа': 'Вік',
    'Вікова група': 'Вік',
    // Шкіра
    'Тип кожи': 'Тип шкіри',
    'Тип шкіри': 'Тип шкіри',
    'Проблема кожи': 'Проблема шкіри',
    'Проблема і стан шкіри': 'Проблема шкіри',
    'Состояние кожи': 'Стан шкіри',
    // Характеристики
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
    // Виробник
    'Страна производитель': 'Країна виробник',
    'Країна Виробника': 'Країна виробник',
    // Інше
    'Количество в упаковке': 'Кількість в упаковці',
    'Цвет': 'Колір',
    'Дополнительный эффект': 'Додатковий ефект',
    'Область применения': 'Область застосування'
};
// Переклад значень (Values)
const ATTR_VALUES_MAP = {
    // Так/Ні
    'Да': 'Так',
    'Нет': 'Ні',
    'true': 'Так',
    'false': 'Ні',
    // Стать
    'Унисекс': 'Унісекс',
    'Женский': 'Жіночий',
    'Мужской': 'Чоловічий',
    // Типи шкіри
    'Все типы кожи': 'Всі типи шкіри',
    'Жирная': 'Жирна',
    'Сухая': 'Суха',
    'Комбинированная (Смешанная)': 'Комбінована',
    'Чувствительная': 'Чутлива',
    'Нормальная': 'Нормальна',
    'Проблемная': 'Проблемна',
    'Увядающая (зрелая)': 'Зріла',
    // Час
    'Универсальный': 'Універсальний',
    'Дневной': 'Денний',
    'Ночной': 'Нічний',
    // Клас
    'Профессиональная': 'Професійна',
    'Масс маркет': 'Мас-маркет',
    'Аптечная': 'Аптечна',
    'Натуральная': 'Натуральна',
    'Органическая': 'Органічна',
    // Країни
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
// 2. НАЛАШТУВАННЯ SUPABASE
// --------------------------------------------------------------------------
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// --------------------------------------------------------------------------
// 3. ДОПОМІЖНІ ФУНКЦІЇ
// --------------------------------------------------------------------------
function transliterate(text) {
    if (!text)
        return '';
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya', 'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g'
    };
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
}
function generateSlug(text) {
    if (!text)
        return 'item-' + Math.floor(Math.random() * 100000);
    return transliterate(text)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
}
function translateValue(val) {
    if (!val)
        return val;
    const trimmed = val.trim();
    // Пошук точного співпадіння
    if (ATTR_VALUES_MAP[trimmed])
        return ATTR_VALUES_MAP[trimmed];
    return trimmed;
}
// --------------------------------------------------------------------------
// 4. ЛОГІКА НОРМАЛІЗАЦІЇ
// --------------------------------------------------------------------------
function normalizeAttributes(rawInput) {
    const normalized = {};
    // 1. Приводимо до масиву [{name, value}]
    let items = [];
    if (Array.isArray(rawInput)) {
        // Варіант XML: <param name="X">Y</param>
        items = rawInput.map(item => ({
            name: item.name || item['@name'],
            value: item['#text'] || item.value || item
        }));
    }
    else if (typeof rawInput === 'object' && rawInput !== null) {
        items = Object.entries(rawInput).map(([k, v]) => {
            let cleanVal = v;
            if (v && typeof v === 'object' && ('#text' in v || 'value' in v)) {
                cleanVal = v['#text'] || v.value;
            }
            return { name: k, value: cleanVal };
        });
    }
    // 2. Обробка
    for (const { name, value } of items) {
        if (!name || value === undefined || value === null || value === '')
            continue;
        const rawName = name.trim();
        const cleanName = ATTR_KEYS_MAP[rawName] || rawName;
        let cleanValue = value;
        if (typeof cleanValue === 'string') {
            // Розбивка по "|" (для "Проблемная|Все типы кожи")
            if (cleanValue.includes('|')) {
                cleanValue = cleanValue
                    .split('|')
                    .map(s => translateValue(s))
                    .filter(Boolean);
            }
            else {
                cleanValue = translateValue(cleanValue);
            }
        }
        // Якщо значення вже є (дублікат ключа в XML), робимо масив
        if (normalized[cleanName]) {
            if (Array.isArray(normalized[cleanName])) {
                normalized[cleanName].push(cleanValue);
            }
            else {
                normalized[cleanName] = [normalized[cleanName], cleanValue];
            }
            // Вирівнювання вкладених масивів
            normalized[cleanName] = normalized[cleanName].flat();
        }
        else {
            normalized[cleanName] = cleanValue;
        }
    }
    return normalized;
}
// --------------------------------------------------------------------------
// 5. РОБОТА З БД (Бренди, Категорії)
// --------------------------------------------------------------------------
const brandCache = {};
async function ensureBrand(brandName) {
    if (!brandName)
        return null;
    const normalizedName = brandName.trim();
    if (brandCache[normalizedName])
        return brandCache[normalizedName];
    // 1. Пошук
    const { data: existing } = await supabase
        .from('brands')
        .select('id')
        .eq('name', normalizedName)
        .single();
    if (existing) {
        brandCache[normalizedName] = existing.id;
        return existing.id;
    }
    // 2. Створення
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
const categoryIdMap = {};
async function importCategories(categories) {
    console.log(`📂 Importing ${categories.length} categories...`);
    for (const cat of categories) {
        // Враховуємо різні формати парсера XML
        const extId = String(cat.id || cat['@id']);
        const name = cat['#text'] || cat.name || cat;
        if (!name || typeof name !== 'string')
            continue;
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
        if (data)
            categoryIdMap[extId] = data.id;
    }
    // Батьківські зв'язки
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
// 6. ІМПОРТ ТОВАРІВ
// --------------------------------------------------------------------------
async function importProducts(offers) {
    console.log(`📦 Processing ${offers.length} offers...`);
    let count = 0;
    for (const offer of offers) {
        try {
            const externalId = String(offer.id || offer['@id']);
            const name = offer.name || offer.model;
            const vendor = offer.vendor; // Бренд з окремого тегу
            const description = offer.description;
            const price = parseFloat(offer.price);
            const oldPrice = offer.oldprice ? parseFloat(offer.oldprice) : null;
            const inStock = (offer.available === 'true' || offer.available === true);
            const vendorCode = offer.vendorCode;
            // Картинки
            let images = [];
            if (Array.isArray(offer.picture))
                images = offer.picture;
            else if (offer.picture)
                images = [offer.picture];
            // 1. Бренд
            const brandId = await ensureBrand(vendor);
            // 2. Категорія
            const categoryId = categoryIdMap[String(offer.categoryId)] || null;
            // 3. Атрибути
            const cleanAttributes = normalizeAttributes(offer.param);
            // Додаємо бренд в атрибути для зручності фільтрації
            if (vendor)
                cleanAttributes['Бренд'] = vendor.trim();
            // 4. Запис
            const { error } = await supabase.from('products').upsert({
                external_id: externalId,
                name,
                slug: generateSlug(name) + '-' + externalId,
                description,
                price,
                old_price: oldPrice,
                currency: 'UAH',
                in_stock: inStock,
                brand_id: brandId, // Foreign Key
                category_id: categoryId, // Foreign Key
                images,
                attributes: cleanAttributes,
                vendor_code: vendorCode
            }, { onConflict: 'external_id' });
            if (error)
                throw error;
            count++;
            if (count % 50 === 0)
                process.stdout.write('.');
        }
        catch (e) {
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
    // 1. Категорії
    const categories = feed.categories;
    if (categories) {
        // Якщо це масив або об'єкт, нормалізуємо до масиву
        const catArray = Array.isArray(categories) ? categories : [categories];
        await importCategories(catArray);
    }
    // 2. Товари
    const offers = feed.products;
    if (offers) {
        const offerArray = Array.isArray(offers) ? offers : [offers];
        await importProducts(offerArray);
    }
    else {
        console.log('⚠️ No products found in XML structure');
    }
}
main().catch(console.error);
