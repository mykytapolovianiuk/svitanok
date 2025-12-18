/**
 * Parse YML (XML) format product data
 */

/**
 * Parse YML (XML) content into structured data
 * @param xmlContent - Raw XML string
 * @returns Parsed data with categories and products
 */
function parseYML(xmlContent) {
  try {
    // 1. Clean content before parsing
    // Replace all ampersands (&) that are NOT the beginning of valid entities (like &amp;, &lt;, &#x...;)
    const cleanContent = xmlContent
      .replace(/&(?!(?:apos|quot|[gl]t|amp);|#x?[0-9a-fA-F]+;)/g, '&amp;');

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanContent, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML Parser Error detail:', parserError.textContent);
      // Try to extract the error message for clarity
      const errorMsg = parserError.textContent?.split('\n')[0] || 'Unknown error';
      throw new Error(`XML structure error: ${errorMsg}. Check line 3666 or characters "&".`);
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

/**
 * Parse categories from XML
 * @param xmlDoc - Parsed XML document
 * @returns Array of parsed categories with external IDs
 */
function parseCategories(xmlDoc) {
  const categories = [];
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

/**
 * Parse products from XML
 * @param xmlDoc - Parsed XML document
 * @returns Array of parsed products
 */
function parseProducts(xmlDoc) {
  const products = [];
  const offerElements = xmlDoc.querySelectorAll('yml_catalog shop offers offer');
  
  offerElements.forEach(offerElement => {
    try {
      const externalId = offerElement.getAttribute('id');
      if (!externalId) {
        console.warn('Product without ID found, skipping');
        return;
      }
      
      // Extract basic product information
      const name = getTextContent(offerElement, 'name');
      const price = parseFloat(getTextContent(offerElement, 'price') || '0');
      const oldPriceText = getTextContent(offerElement, 'oldprice');
      const oldPrice = oldPriceText ? parseFloat(oldPriceText) : undefined;
      const currency = getTextContent(offerElement, 'currencyId') || 'UAH';
      const description = getTextContent(offerElement, 'description') || '';
      const categoryId = getTextContent(offerElement, 'categoryId') || '';
      
      // Extract vendor information
      const vendor = getTextContent(offerElement, 'vendor');
      const vendorCode = getTextContent(offerElement, 'vendorCode');
      const countryOfOrigin = getTextContent(offerElement, 'country_of_origin');
      
      // Extract images
      const images = [];
      const pictureElements = offerElement.querySelectorAll('picture');
      pictureElements.forEach(picElement => {
        const imageUrl = picElement.textContent?.trim();
        if (imageUrl) {
          images.push(imageUrl);
        }
      });
      
      // Extract attributes from param tags
      const attributes = {};
      const paramElements = offerElement.querySelectorAll('param');
      paramElements.forEach(paramElement => {
        const paramName = paramElement.getAttribute('name');
        const paramUnit = paramElement.getAttribute('unit');
        const paramValue = paramElement.textContent?.trim() || '';
        
        if (paramName) {
          // Construct value with unit if available
          const value = paramUnit ? `${paramValue} ${paramUnit}` : paramValue;
          attributes[paramName] = value;
        }
      });
      
      // Validate required fields
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

/**
 * Helper function to get text content of a child element
 * @param parentElement - Parent element to search in
 * @param tagName - Tag name to search for
 * @returns Text content or empty string
 */
function getTextContent(parentElement, tagName) {
  const element = parentElement.querySelector(tagName);
  return element ? element.textContent?.trim() || '' : '';
}

module.exports = { parseYML };