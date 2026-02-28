import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { translate } from 'bing-translate-api';
import fetch from 'node-fetch';

// ================= НАСТРОЙКИ =================
const FEED_URL = 'https://shiny.kyiv.ua/products_feed.xml?hash_tag=f2dc5254059a5b043f8c530a2607c515&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=0&yandex_cpa=&process_presence_sure=&languages=uk&extra_fields=&group_ids=';
const TARGET_BRAND = 'Dr. Spiller';
const OUTPUT_FILE = './dr-spiller-ukr.xml'; // Куда сохраним результат
const CACHE_FILE = './translation_cache.json'; // Кэш переводов
// =============================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Функция для безопасного оборачивания текста в CDATA или экранирования
const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'; case '>': return '&gt;';
      case '&': return '&amp;'; case '\'': return '&apos;';
      case '"': return '&quot;'; default: return c;
    }
  });
};

// Загрузка кэша
let translationCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    translationCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) {
    console.error('Ошибка загрузки кэша:', e);
  }
}

const saveCache = () => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(translationCache, null, 2), 'utf8');
};

// Батч-перевод массива строк
async function translateBatch(strings) {
  const toTranslate = strings.filter(s => s && !translationCache[s] && !s.match(/^[\d\s\.\-,]+$/));
  if (toTranslate.length === 0) return;

  console.log(`\n⏳ Нужно перевести новых фраз: ${toTranslate.length}`);

  // Разобьем на чанки по 10 строк
  const CHUNK_SIZE = 10;
  for (let i = 0; i < toTranslate.length; i += CHUNK_SIZE) {
    const chunk = toTranslate.slice(i, i + CHUNK_SIZE);
    console.log(`🔄 Переводим батч [${i + 1} - ${Math.min(i + CHUNK_SIZE, toTranslate.length)}] из ${toTranslate.length}...`);

    const combinedText = chunk.join(' ||| ');
    try {
      const res = await translate(combinedText, null, 'uk');
      const translatedParts = res.translation.split(/\|\|\||\|\||\| \| \|/).map(s => s.trim());

      // Идем по чанку и сопоставляем результаты
      for (let j = 0; j < chunk.length; j++) {
        const orig = chunk[j];
        const trans = translatedParts[j] || orig;
        translationCache[orig] = trans;
      }
      saveCache();
      await sleep(1000); // пауза между батчами
    } catch (err) {
      console.error('   ⚠️ Ошибка перевода батча.', err.message);
      // При ошибке сохраняем оригиналы, чтобы не застрять (или просто продолжаем)
      chunk.forEach(s => translationCache[s] = s);
      saveCache();
      await sleep(3000);
    }
  }
}

function getTranslated(text) {
  if (!text) return text;
  if (text.match(/^[\d\s\.\-,]+$/)) return text; // числа
  return translationCache[text] || text;
}

async function generateXml() {
  console.log(`\n📥 1. Скачиваем оригинальный фид...`);
  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) throw new Error('Не удалось скачать XML фид');
    const xmlData = await response.text();

    console.log('⚙️ 2. Парсим XML...');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const result = parser.parse(xmlData);

    let offers = result?.yml_catalog?.shop?.offers?.offer || [];
    if (!Array.isArray(offers)) offers = [offers];

    // Ищем нужный бренд
    const brandOffers = offers.filter(o =>
      (o.vendor && o.vendor.includes(TARGET_BRAND)) ||
      (o.name && o.name.toLowerCase().includes('dr.spiller'))
    );

    console.log(`🎯 Знайдено товарів Dr. Spiller: ${brandOffers.length}\n`);
    if (brandOffers.length === 0) return;

    // Сначала собираем все уникальные строки: названия, описания, имена параметров, значения параметров
    const uniqueStrings = new Set();
    brandOffers.forEach(o => {
      if (o.name) uniqueStrings.add(o.name);
      if (o.description) uniqueStrings.add(o.description.trim());

      if (o.param) {
        const params = Array.isArray(o.param) ? o.param : [o.param];
        params.forEach(p => {
          if (p['@_name']) uniqueStrings.add(p['@_name']);
          if (p['#text']) {
            String(p['#text']).split('|').forEach(v => uniqueStrings.add(v.trim()));
          }
        });
      }
    });

    // Переводим все неизвесные строки батчами
    await translateBatch(Array.from(uniqueStrings));

    console.log(`\n🚀 3. Генерируем финальный XML...`);
    let generatedOffersXml = '';

    for (let i = 0; i < brandOffers.length; i++) {
      const offer = brandOffers[i];

      let translatedName = getTranslated(offer.name).replace(/"/g, '&quot;');
      let translatedDesc = getTranslated(offer.description?.trim() || '');

      // Сбор и перевод параметров
      let paramsXml = '';
      if (offer.param) {
        const params = Array.isArray(offer.param) ? offer.param : [offer.param];
        for (const p of params) {
          if (p['@_name'] && p['#text']) {
            const transName = getTranslated(p['@_name']);
            // Значения могут быть разделены |
            const transValue = String(p['#text']).split('|')
              .map(v => getTranslated(v.trim()))
              .join('|');

            paramsXml += `        <param name="${escapeXml(transName)}">${escapeXml(transValue)}</param>\n`;
          }
        }
      }

      // Картинки
      let picturesXml = '';
      if (offer.picture) {
        const pics = Array.isArray(offer.picture) ? offer.picture : [offer.picture];
        pics.forEach(pic => picturesXml += `        <picture>${escapeXml(pic)}</picture>\n`);
      }

      // Опциональные поля
      const oldPriceXml = offer.oldprice ? `        <oldprice>${offer.oldprice}</oldprice>\n` : '';

      // Собираем XML тег <offer>
      generatedOffersXml += `
      <offer id="${escapeXml(String(offer['@_id']))}" available="${offer['@_available'] || 'true'}">
        <name>${escapeXml(translatedName)}</name>
        <vendor>${escapeXml(TARGET_BRAND)}</vendor>
        <categoryId>${escapeXml(String(offer.categoryId || ''))}</categoryId>
        <price>${offer.price || 0}</price>
${oldPriceXml}        <currencyId>${escapeXml(offer.currencyId || 'UAH')}</currencyId>
        <vendorCode>${escapeXml(String(offer.vendorCode || offer['@_id']))}</vendorCode>
        <description><![CDATA[${translatedDesc}]]></description>
${picturesXml}${paramsXml}      </offer>`;
    }

    // Оборачиваем в стандартную структуру YML
    const finalXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString()}">
  <shop>
    <offers>${generatedOffersXml}
    </offers>
  </shop>
</yml_catalog>`;

    fs.writeFileSync(OUTPUT_FILE, finalXml, 'utf8');
    console.log(`\n🎉 ГОТОВО! Переведенный файл сохранен как: ${OUTPUT_FILE}`);
    console.log('Теперь ты можешь открыть его, проверить глазами и загрузить через Админку.');

  } catch (error) {
    console.error('Критическая ошибка:', error);
  }
}

generateXml();