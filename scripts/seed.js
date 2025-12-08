import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ініціалізація
dotenv.config({ path: '.env.local' });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const filePath = path.join(__dirname, '../export-products.csv');

console.log('=== ПОВНИЙ ІМПОРТ (МАСИВ НА ОСНОВІ ПАРСИНГУ) ===');

let headers = []; // Ініціалізуємо як порожній масив
let charIndexes = []; // Індекси для Назва_Характеристики
let coreColumnIndexes = {}; // Індекси для основних колонок
let results = []; // Масив для зберігання всіх рядків даних

// Функція для перетворення об'єкта з числовими ключами в масив
function objectToArray(obj) {
  const arr = [];
  let i = 0;
  while (obj.hasOwnProperty(i.toString())) {
    arr.push(obj[i.toString()]);
    i++;
  }
  return arr;
}

fs.createReadStream(filePath)
  .pipe(csv({ headers: false })) // Читаємо як об'єкти
  .on('data', (row) => {
    // Якщо це перший рядок (заголовки)
    if (headers.length === 0) {
      // Перетворюємо об'єкт в масив
      headers = objectToArray(row);
      console.log('Тип headers:', typeof headers);
      console.log('Headers length:', headers.length);
      console.log('Перші 5 заголовків:', headers.slice(0, 5));
      
      // Знаходимо індекси основних колонок
      coreColumnIndexes = {
        name: headers.indexOf('Назва_позиції_укр'),
        nameFallback: headers.indexOf('Назва_позиції'),
        price: headers.indexOf('Ціна'),
        externalId: headers.indexOf('Унікальний_ідентифікатор'),
        externalIdFallback: headers.indexOf('Код_товару'),
        images: headers.indexOf('Посилання_зображення'),
        availability: headers.indexOf('Наявність'),
        description: headers.indexOf('Опис_укр'),
        descriptionFallback: headers.indexOf('Опис'),
        weight: headers.indexOf('Вага,кг')
      };
      
      // Знаходимо всі індекси для Назва_Характеристики
      charIndexes = [];
      headers.forEach((header, index) => {
        if (header === 'Назва_Характеристики') {
          charIndexes.push(index);
        }
      });
      
      console.log('Знайдено індекси:');
      console.log('- Назва_позиції_укр:', coreColumnIndexes.name);
      console.log('- Назва_позиції:', coreColumnIndexes.nameFallback);
      console.log('- Ціна:', coreColumnIndexes.price);
      console.log('- Унікальний_ідентифікатор:', coreColumnIndexes.externalId);
      console.log('- Код_товару:', coreColumnIndexes.externalIdFallback);
      console.log('- Посилання_зображення:', coreColumnIndexes.images);
      console.log('- Наявність:', coreColumnIndexes.availability);
      console.log('- Опис_укр:', coreColumnIndexes.description);
      console.log('- Опис:', coreColumnIndexes.descriptionFallback);
      console.log('- Вага,кг:', coreColumnIndexes.weight);
      console.log('- Кількість Назва_Характеристики:', charIndexes.length);
      
      return;
    }
    
    // Обробляємо рядки даних
    // Перетворюємо об'єкт в масив
    const rowArray = objectToArray(row);
    results.push(rowArray);
  })
  .on('end', async () => {
    console.log(`Зчитано рядків: ${results.length}. Починаємо заливку...`);
    await processAllRows();
  });

async function processAllRows() {
  let success = 0;
  let errors = 0;
  
  // Обробляємо всі рядки
  for (const row of results) {
    try {
      // 1. Валідація (без ID і Назви товар не створити)
      const externalId = row[coreColumnIndexes.externalId] || row[coreColumnIndexes.externalIdFallback];
      const name = row[coreColumnIndexes.name] || row[coreColumnIndexes.nameFallback];
      
      if (!externalId || !name) {
        continue;
      }

      // 2. ФОРМУВАННЯ АТРИБУТІВ
      // Спочатку копіюємо ВСІ колонки з CSV
      const attributes = {};
      
      // Додаємо всі колонки як атрибути
      headers.forEach((header, index) => {
        if (row[index] && row[index].trim()) {
          attributes[header] = row[index].trim();
        }
      });

      // Обробляємо характеристики (триади)
      charIndexes.forEach(index => {
        const charName = row[index];
        if (!charName || !charName.trim()) return;
        
        const cleanName = charName.trim();
        
        // Визначаємо індекси значення та одиниці виміру
        // Зазвичай: Назва_Характеристики, Одиниця_виміру_Характеристики, Значення_Характеристики
        const unitIndex = index + 1;
        const valueIndex = index + 2;
        
        // Перевіряємо заголовки для підтвердження розташування
        const unitHeader = headers[unitIndex];
        const valueHeader = headers[valueIndex];
        
        let unit = '';
        let value = '';
        
        // Логіка визначення розташування значення та одиниці
        if (unitHeader && unitHeader.includes('Одиниця') && valueHeader && valueHeader.includes('Значення')) {
          // Стандартний варіант: Назва -> Одиниця -> Значення
          unit = row[unitIndex] ? row[unitIndex].trim() : '';
          value = row[valueIndex] ? row[valueIndex].trim() : '';
        } else if (unitHeader && unitHeader.includes('Значення') && valueHeader && valueHeader.includes('Одиниця')) {
          // Альтернативний варіант: Назва -> Значення -> Одиниця
          value = row[unitIndex] ? row[unitIndex].trim() : '';
          unit = row[valueIndex] ? row[valueIndex].trim() : '';
        } else {
          // Якщо не вдалося визначити, пробуємо стандартний порядок
          unit = row[unitIndex] ? row[unitIndex].trim() : '';
          value = row[valueIndex] ? row[valueIndex].trim() : '';
        }
        
        // Формуємо значення: значення + одиниця виміру
        const fullValue = unit ? `${value} ${unit}` : value;
        if (fullValue) {
          attributes[cleanName] = fullValue;
        }
      });

      // 3. ОБРОБКА ЦІНИ
      const price = parseFloat(row[coreColumnIndexes.price]) || 0;
      const discount = parseFloat(row[coreColumnIndexes.price + 1]) || 0; // Знижка зазвичай після ціни
      let oldPrice = null;
      if (discount > 0) oldPrice = price + discount;

      // 4. ЗОБРАЖЕННЯ
      const images = row[coreColumnIndexes.images]
          ? row[coreColumnIndexes.images].split(',').map(u => u.trim()).filter(Boolean)
          : [];

      // 5. ПІДГОТОВКА ОБ'ЄКТУ
      const productData = {
          external_id: externalId.toString(),
          name: name.trim(),
          slug: slugify(name) + '-' + externalId,
          description: row[coreColumnIndexes.description] || row[coreColumnIndexes.descriptionFallback] || '',
          price: price,
          old_price: oldPrice,
          currency: 'UAH',
          in_stock: row[coreColumnIndexes.availability] === '+',
          images: images,
          attributes: attributes // ВСІ дані з CSV тут
      };

      // 6. ЗАПИС В БАЗУ
      const { error } = await supabase
          .from('products')
          .upsert(productData, { onConflict: 'external_id' });

      if (error) {
        console.error(`❌ Помилка [${productData.name}]:`, error.message);
        errors++;
      } else {
        success++;
        if (success % 50 === 0) process.stdout.write('.');
      }

    } catch (err) {
      console.error('Критична помилка рядка:', err);
      errors++;
    }
  }
  
  console.log(`\n✅ Імпорт завершено! Успішно: ${success}, Помилок: ${errors}`);
}

// Хелпер для створення URL
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-а-яіїєґ]+/g, '')
    .replace(/\-\-+/g, '-');
}