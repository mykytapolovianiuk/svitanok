/**
 * Product Feed Generator for Facebook Commerce
 * Generates XML feed compatible with Facebook Catalog
 * Refreshes automatically every 24h
 */

import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, logCorsAttempt } from '../utils/cors.js';
import { checkRateLimit } from '../utils/rateLimit.js';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let cachedFeed = null;
let cacheTimestamp = 0;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  logCorsAttempt(origin, [
    'https://svitanok.com',
    'https://www.svitanok.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [])
  ]);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Rate limiting
  if (!checkRateLimit(req, res, 'feed')) {
    return;
  }
  
  try {
    // Check cache
    const now = Date.now();
    if (cachedFeed && (now - cacheTimestamp) < CACHE_DURATION) {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      return res.status(200).send(cachedFeed);
    }
    
    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch all products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Get base URL from environment or request
    const baseUrl = process.env.VITE_SITE_URL || 
                    (req.headers.host ? `https://${req.headers.host}` : 'https://svitanok.com');
    
    // Generate XML feed
    const xml = generateFeedXML(products || [], baseUrl);
    
    // Cache the feed
    cachedFeed = xml;
    cacheTimestamp = now;
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    return res.status(200).send(xml);
    
  } catch (error) {
    // Error handling in production
    return res.status(500).json({ 
      error: 'Failed to generate product feed',
      message: error.message 
    });
  }
}

function generateFeedXML(products, baseUrl) {
  const items = products.map(product => {
    const productUrl = `${baseUrl}/product/${product.slug}`;
    const imageUrl = product.images && product.images.length > 0 
      ? product.images[0] 
      : `${baseUrl}/placeholder-product.jpg`;
    
    // Extract brand and category from attributes
    const brand = product.attributes?.Виробник || 
                  product.attributes?.Brand || 
                  'Svitanok';
    const category = product.attributes?.Назва_групи || 
                     product.attributes?.Category || 
                     'Косметика';
    
    // Format price (Facebook requires price in format: "UAH 1500.00")
    const price = `${product.currency || 'UAH'} ${product.price.toFixed(2)}`;
    
    // Determine availability
    const availability = product.in_stock ? 'in stock' : 'out of stock';
    
    // Generate description (limit to 5000 chars for Facebook)
    const description = (product.description || product.name || '')
      .substring(0, 5000)
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    return `
    <item>
      <g:id>${escapeXML(String(product.id))}</g:id>
      <g:title>${escapeXML(product.name)}</g:title>
      <g:description>${escapeXML(description)}</g:description>
      <g:link>${escapeXML(productUrl)}</g:link>
      <g:image_link>${escapeXML(imageUrl)}</g:image_link>
      <g:price>${escapeXML(price)}</g:price>
      <g:availability>${availability}</g:availability>
      <g:brand>${escapeXML(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXML(category)}</g:product_type>
      ${product.old_price ? `<g:sale_price>${escapeXML(`${product.currency || 'UAH'} ${product.old_price.toFixed(2)}`)}</g:sale_price>` : ''}
      ${product.sku || product.external_id ? `<g:mpn>${escapeXML(String(product.sku || product.external_id))}</g:mpn>` : ''}
    </item>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Svitanok Product Feed</title>
    <link>${baseUrl}</link>
    <description>Product feed for Svitanok cosmetics store</description>
    ${items}
  </channel>
</rss>`;
}

function escapeXML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

