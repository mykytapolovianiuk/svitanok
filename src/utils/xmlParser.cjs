/**
 * Parse YML (XML) format product data
 */

// Use xmldom for Node.js environment
const { DOMParser } = require('xmldom');
const xpath = require('xpath');

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
    const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
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
  const categoryNodes = xpath.select('//yml_catalog/shop/categories/category', xmlDoc);
  
  categoryNodes.forEach(categoryNode => {
    const externalId = categoryNode.getAttribute('id');
    const name = categoryNode.textContent?.trim() || '';
    
    if (!externalId) {
      console.warn('Category without ID found, skipping');
      return;
    }
    
    const parentExternalId = categoryNode.getAttribute('parentId') || undefined;
    
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
  const offerNodes = xpath.select('//yml_catalog/shop/offers/offer', xmlDoc);
  
  offerNodes.forEach(offerNode => {
    try {
      const externalId = offerNode.getAttribute('id');
      if (!externalId) {
        console.warn('Product without ID found, skipping');
        return;
      }
      
      // Extract basic product information
      const name = getTextContent(offerNode, 'name');
      const price = parseFloat(getTextContent(offerNode, 'price') || '0');
      const oldPriceText = getTextContent(offerNode, 'oldprice');
      const oldPrice = oldPriceText ? parseFloat(oldPriceText) : undefined;
      const currency = getTextContent(offerNode, 'currencyId') || 'UAH';
      const description = getTextContent(offerNode, 'description') || '';
      const categoryId = getTextContent(offerNode, 'categoryId') || '';
      
      // Extract vendor information
      const vendor = getTextContent(offerNode, 'vendor');
      const vendorCode = getTextContent(offerNode, 'vendorCode');
      const countryOfOrigin = getTextContent(offerNode, 'country_of_origin');
      
      // Extract images
      const images = [];
      const pictureNodes = xpath.select('./picture', offerNode);
      pictureNodes.forEach(picNode => {
        const imageUrl = picNode.textContent?.trim();
        if (imageUrl) {
          images.push(imageUrl);
        }
      });
      
      // Extract attributes from param tags
      const attributes = {};
      const paramNodes = xpath.select('./param', offerNode);
      paramNodes.forEach(paramNode => {
        const paramName = paramNode.getAttribute('name');
        const paramUnit = paramNode.getAttribute('unit');
        const paramValue = paramNode.textContent?.trim() || '';
        
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
  const nodes = xpath.select(`./${tagName}`, parentElement);
  if (nodes && nodes.length > 0) {
    return nodes[0].textContent?.trim() || '';
  }
  return '';
}

module.exports = { parseYML };