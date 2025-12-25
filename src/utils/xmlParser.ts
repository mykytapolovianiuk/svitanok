

interface ParsedCategory {
  externalId: string;
  name: string;
  parentExternalId?: string;
}

interface ParsedProduct {
  externalId: string;
  name: string;
  price: number;
  oldPrice?: number;
  currency: string;
  images: string[];
  categoryId: string;
  vendor?: string;
  vendorCode?: string;
  countryOfOrigin?: string;
  description: string;
  attributes: Record<string, string>;
}

export interface ParsedYMLData {
  categories: ParsedCategory[];
  products: ParsedProduct[];
}


export function parseYML(xmlContent: string): ParsedYMLData {
  try {
    
    
    const cleanContent = xmlContent
      .replace(/&(?!(?:apos|quot|[gl]t|amp);|#x?[0-9a-fA-F]+;)/g, '&amp;');

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanContent, 'text/xml');

    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML Parser Error detail:', parserError.textContent);
      
      const errorMsg = parserError.textContent?.split('\n')[0] || 'Unknown error';
      throw new Error(`Помилка структури XML: ${errorMsg}. Перевірте рядок 3666 або символи "&".`);
    }

    return {
      categories: parseCategories(xmlDoc),
      products: parseProducts(xmlDoc)
    };
  } catch (error) {
    console.error('Error in parseYML:', error);
    throw error;
  }
}


function parseCategories(xmlDoc: Document): ParsedCategory[] {
  const categories: ParsedCategory[] = [];
  const categoryElements = xmlDoc.querySelectorAll('yml_catalog shop categories category');
  
  categoryElements.forEach(categoryElement => {
    const externalId = categoryElement.getAttribute('id');
    const name = categoryElement.textContent?.trim() || '';
    
    if (!externalId) {
      console.warn('Category without ID found, skipping');
      return;
    }
    
    const parentExternalId = categoryElement.getAttribute('parentId') || undefined;
    
    categories.push({
      externalId,
      name,
      parentExternalId
    });
  });
  
  return categories;
}


function parseProducts(xmlDoc: Document): ParsedProduct[] {
  const products: ParsedProduct[] = [];
  const offerElements = xmlDoc.querySelectorAll('yml_catalog shop offers offer');
  
  offerElements.forEach(offerElement => {
    try {
      const externalId = offerElement.getAttribute('id');
      if (!externalId) {
        console.warn('Product without ID found, skipping');
        return;
      }
      
      
      const name = getTextContent(offerElement, 'name');
      const price = parseFloat(getTextContent(offerElement, 'price') || '0');
      const oldPriceText = getTextContent(offerElement, 'oldprice');
      const oldPrice = oldPriceText ? parseFloat(oldPriceText) : undefined;
      const currency = getTextContent(offerElement, 'currencyId') || 'UAH';
      const description = getTextContent(offerElement, 'description') || '';
      const categoryId = getTextContent(offerElement, 'categoryId') || '';
      
      
      const vendor = getTextContent(offerElement, 'vendor');
      const vendorCode = getTextContent(offerElement, 'vendorCode');
      const countryOfOrigin = getTextContent(offerElement, 'country_of_origin');
      
      
      const images: string[] = [];
      const pictureElements = offerElement.querySelectorAll('picture');
      pictureElements.forEach(picElement => {
        const imageUrl = picElement.textContent?.trim();
        if (imageUrl) {
          images.push(imageUrl);
        }
      });
      
      
      const attributes: Record<string, string> = {};
      const paramElements = offerElement.querySelectorAll('param');
      paramElements.forEach(paramElement => {
        const paramName = paramElement.getAttribute('name');
        const paramUnit = paramElement.getAttribute('unit');
        const paramValue = paramElement.textContent?.trim() || '';
        
        if (paramName) {
          
          const value = paramUnit ? `${paramValue} ${paramUnit}` : paramValue;
          attributes[paramName] = value;
        }
      });
      
      
      if (!name || !categoryId) {
        console.warn(`Product ${externalId} missing required fields, skipping`);
        return;
      }
      
      products.push({
        externalId,
        name,
        price,
        oldPrice,
        currency,
        images,
        categoryId,
        vendor: vendor || undefined,
        vendorCode: vendorCode || undefined,
        countryOfOrigin: countryOfOrigin || undefined,
        description,
        attributes
      });
    } catch (error) {
      console.error('Error parsing product:', error);
    }
  });
  
  return products;
}


function getTextContent(parentElement: Element, tagName: string): string {
  const element = parentElement.querySelector(tagName);
  return element ? element.textContent?.trim() || '' : '';
}