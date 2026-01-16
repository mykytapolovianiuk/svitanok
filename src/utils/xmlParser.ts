import { XMLParser } from 'fast-xml-parser';

/**
 * Parses YML (XML) content into a JavaScript object using fast-xml-parser.
 * This is compatible with Node.js environments (server-side scripts).
 */
export function parseYML(xmlContent: string): any {
  // 1. Попередня очистка (якщо є проблеми з амперсандами, хоча fast-xml-parser зазвичай справляється)
  // Можна залишити базову очистку, якщо XML дуже "брудний"
  const cleanContent = xmlContent; // xmlContent.replace(/&(?!(?:apos|quot|[gl]t|amp);|#x?[0-9a-fA-F]+;)/g, '&amp;');

  const parser = new XMLParser({
    ignoreAttributes: false,       // Читати атрибути (id, parentId, name)
    attributeNamePrefix: "",       // Не додавати префікс "@_" до атрибутів, щоб було просто obj.id
    textNodeName: "#text",         // Текст всередині тегу буде доступний через поле #text
    trimValues: true,              // Обрізати пробіли
    isArray: (name) => {
      // Примусово перетворювати ці теги на масиви, навіть якщо елемент всього один.
      // Це критично важливо для стабільності скрипта імпорту.
      const arrayTags = [
        'offer',      // Товари
        'category',   // Категорії
        'param',      // Атрибути
        'picture',    // Картинки
        'currency'    // Валюти
      ];
      return arrayTags.indexOf(name) !== -1;
    }
  });

  try {
    const result = parser.parse(cleanContent);

    // Стандартна структура YML: <yml_catalog><shop>...</shop></yml_catalog>
    // Повертаємо об'єкт 'shop', щоб скрипт мав прямий доступ до categories та offers
    if (result.yml_catalog && result.yml_catalog.shop) {
      return result.yml_catalog.shop;
    }

    return result;
  } catch (error) {
    console.error('XML Parser Error:', error);
    throw new Error('Failed to parse XML file');
  }
}