import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


dotenv.config({ path: '.env.local' });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const filePath = path.join(__dirname, '../export-products.csv');

console.log('=== ПОВНИЙ ІМПОРТ (МАСИВ НА ОСНОВІ ПАРСИНГУ) ===');

let headers = []; 
let charIndexes = []; 
let coreColumnIndexes = {}; 
let results = []; 


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
  .pipe(csv({ headers: false })) 
  .on('data', (row) => {
    
    if (headers.length === 0) {
      
      headers = objectToArray(row);
      console.log('Тип headers:', typeof headers);
      console.log('Headers length:', headers.length);
      console.log('Перші 5 заголовків:', headers.slice(0, 5));
      
      
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
  
  
  for (const row of results) {
    try {
      
      const externalId = row[coreColumnIndexes.externalId] || row[coreColumnIndexes.externalIdFallback];
      const name = row[coreColumnIndexes.name] || row[coreColumnIndexes.nameFallback];
      
      if (!externalId || !name) {
        continue;
      }

      
      
      const attributes = {};
      
      
      headers.forEach((header, index) => {
        if (row[index] && row[index].trim()) {
          attributes[header] = row[index].trim();
        }
      });

      
      charIndexes.forEach(index => {
        const charName = row[index];
        if (!charName || !charName.trim()) return;
        
        const cleanName = charName.trim();
        
        
        
        const unitIndex = index + 1;
        const valueIndex = index + 2;
        
        
        const unitHeader = headers[unitIndex];
        const valueHeader = headers[valueIndex];
        
        let unit = '';
        let value = '';
        
        
        if (unitHeader && unitHeader.includes('Одиниця') && valueHeader && valueHeader.includes('Значення')) {
          
          unit = row[unitIndex] ? row[unitIndex].trim() : '';
          value = row[valueIndex] ? row[valueIndex].trim() : '';
        } else if (unitHeader && unitHeader.includes('Значення') && valueHeader && valueHeader.includes('Одиниця')) {
          
          value = row[unitIndex] ? row[unitIndex].trim() : '';
          unit = row[valueIndex] ? row[valueIndex].trim() : '';
        } else {
          
          unit = row[unitIndex] ? row[unitIndex].trim() : '';
          value = row[valueIndex] ? row[valueIndex].trim() : '';
        }
        
        
        const fullValue = unit ? `${value} ${unit}` : value;
        if (fullValue) {
          attributes[cleanName] = fullValue;
        }
      });

      
      const price = parseFloat(row[coreColumnIndexes.price]) || 0;
      const discount = parseFloat(row[coreColumnIndexes.price + 1]) || 0; 
      let oldPrice = null;
      if (discount > 0) oldPrice = price + discount;

      
      const images = row[coreColumnIndexes.images]
          ? row[coreColumnIndexes.images].split(',').map(u => u.trim()).filter(Boolean)
          : [];

      
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
          attributes: attributes 
      };

      
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


function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-а-яіїєґ]+/g, '')
    .replace(/\-\-+/g, '-');
}